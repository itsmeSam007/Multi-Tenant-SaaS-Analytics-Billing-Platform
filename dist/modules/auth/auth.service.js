"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const users_service_1 = require("../users/users.service");
const password_util_1 = require("../../common/security/password.util");
const enums_1 = require("../../generated/prisma/enums");
let AuthService = class AuthService {
    usersService;
    prisma;
    jwtService;
    config;
    constructor(usersService, prisma, jwtService, config) {
        this.usersService = usersService;
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.config = config;
    }
    // =========================
    // Register
    // =========================
    async register(dto) {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing) {
            throw new common_1.ConflictException('Email already registered');
        }
        const passwordHash = await (0, password_util_1.hashPassword)(dto.password);
        const user = await this.usersService.createUser({
            email: dto.email,
            passwordHash,
            role: enums_1.Role.USER, // ✅ default role assignment
        });
        return {
            id: user.id,
            email: user.email,
        };
    }
    // =========================
    // Validate user (for controller usage)
    // =========================
    async validateUser(email, password) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.lockUntil && user.lockUntil > new Date()) {
            throw new common_1.UnauthorizedException('Account temporarily locked');
        }
        const isValid = await (0, password_util_1.verifyPassword)(password, user.passwordHash);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return user;
    }
    // =========================
    // Login
    // =========================
    async login(email, password) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        // 🔒 Account locked?
        if (user.lockUntil && user.lockUntil > new Date()) {
            throw new common_1.UnauthorizedException('Account temporarily locked');
        }
        const isValid = await (0, password_util_1.verifyPassword)(password, user.passwordHash);
        if (!isValid) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginCount: { increment: 1 },
                    lockUntil: user.failedLoginCount + 1 >= 5
                        ? new Date(Date.now() + 15 * 60 * 1000) // 15 min
                        : null,
                },
            });
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        // ✅ Reset counters on success
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginCount: 0,
                lockUntil: null,
            },
        });
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }
    // =========================
    // Token helpers
    // =========================
    async generateTokens(userId, email, role) {
        const payload = {
            sub: userId,
            email,
            role,
        };
        const accessToken = await this.jwtService.signAsync(payload);
        const refreshToken = await this.generateRefreshToken(userId, email, role);
        // const refreshToken = await this.jwtService.signAsync(
        //   //{ sub: userId },
        //   {secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret'},
        //   { expiresIn: 60 * 60 * 24 * 7 }, // 7 days
        // );
        return { accessToken, refreshToken };
    }
    async generateRefreshToken(userId, email, role) {
        const refreshSecret = this.config.get('JWT_REFRESH_SECRET');
        if (!refreshSecret) {
            throw new Error('JWT_REFRESH_SECRET not defined');
        }
        return this.jwtService.signAsync({
            sub: userId,
            email,
            role,
            jti: (0, crypto_1.randomUUID)(), // ← guarantees uniqueness even within the same second
        }, {
            secret: refreshSecret,
            expiresIn: '7d',
        });
    }
    async updateRefreshToken(userId, refreshToken) {
        const hashed = (0, password_util_1.hashToken)(refreshToken); // ← sync, no await needed
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                refreshTokenHash: hashed,
            },
        });
    }
    // =========================
    // Refresh flow
    // =========================
    async refreshTokens(userId, refreshToken) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.refreshTokenHash) {
            throw new common_1.UnauthorizedException('Token reuse detected or session expired');
        }
        // Use verifyToken (SHA-256) not verifyPassword (bcrypt) — JWTs exceed 72 bytes
        const isValid = (0, password_util_1.verifyToken)(refreshToken, user.refreshTokenHash);
        if (!isValid) {
            await this.logout(userId);
            throw new common_1.UnauthorizedException('Token reuse detected');
        }
        // Atomically claim the session
        const result = await this.prisma.$executeRaw `
    UPDATE users
    SET "refreshTokenHash" = NULL
    WHERE id = ${userId}
    AND "refreshTokenHash" IS NOT NULL
  `;
        if (result === 0) {
            throw new common_1.UnauthorizedException('Token reuse detected');
        }
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }
    // =========================
    // Logout
    // =========================
    async logout(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshTokenHash: null },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map