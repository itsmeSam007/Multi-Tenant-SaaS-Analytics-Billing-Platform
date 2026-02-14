"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('jwt', () => ({
    accessTokenSecret: process.env.JWT_SECRET,
    accessTokenTtlSeconds: 900, // 15 minutes
}));
//# sourceMappingURL=jwt.config.js.map