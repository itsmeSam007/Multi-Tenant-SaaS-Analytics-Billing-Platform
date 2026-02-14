"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.hashToken = hashToken;
exports.verifyToken = verifyToken;
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
// Passwords: use bcrypt (slow hash protects low-entropy inputs)
const SALT_ROUNDS = process.env.NODE_ENV === 'test' ? 1 : 12;
async function hashPassword(plain) {
    return bcrypt.hash(plain, SALT_ROUNDS);
}
async function verifyPassword(plain, hash) {
    if (!plain || !hash)
        return false;
    return bcrypt.compare(plain, hash);
}
// Tokens: use SHA-256 (tokens are already cryptographically random,
// bcrypt's 72-byte truncation makes it unsafe for long inputs like JWTs)
function hashToken(token) {
    return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
}
function verifyToken(token, storedHash) {
    if (!token || !storedHash)
        return false;
    try {
        const incoming = Buffer.from((0, crypto_1.createHash)('sha256').update(token).digest('hex'), 'hex');
        const stored = Buffer.from(storedHash, 'hex');
        return (0, crypto_1.timingSafeEqual)(incoming, stored);
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=password.util.js.map