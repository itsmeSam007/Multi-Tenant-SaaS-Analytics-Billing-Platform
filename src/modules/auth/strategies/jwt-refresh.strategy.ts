// src/modules/auth/strategies/jwt-refresh.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  // constructor(private config: ConfigService) {
    
  //   const refreshSecret = process.env.JWT_REFRESH_SECRET;

  //   if (!refreshSecret) {
  //     throw new Error('JWT_REFRESH_SECRET is not defined');
  //   }

  //   const options: StrategyOptionsWithRequest = {
  //     jwtFromRequest: ExtractJwt.fromExtractors([
  //       (req: Request) => req?.cookies?.refresh_token,
  //     ]),
  //     secretOrKey: refreshSecret,
  //     passReqToCallback: true,
  //   };

  //   super(options);
  // }

  constructor(private config: ConfigService) {
    
  const refreshSecret = config.get<string>('JWT_REFRESH_SECRET');

  if (!refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  super({
    jwtFromRequest: ExtractJwt.fromExtractors([
      (req: Request) => req?.cookies?.refresh_token,
    ]),
    secretOrKey: refreshSecret,
    passReqToCallback: true,
  });
}


  

  async validate(req: Request, payload: any) {
    const refreshToken = req?.cookies?.refresh_token;

    // 🔍 DEBUG
    console.log('=== STRATEGY VALIDATE ===');
    console.log('payload.sub:', payload.sub);
    console.log('token from cookie prefix:', refreshToken?.substring(0, 50));

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    return {
      ...payload,
      refreshToken,
    };
  }
}
