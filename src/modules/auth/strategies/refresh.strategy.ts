import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class RefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: (req: Request) =>
        req.cookies?.refresh_token,
      secretOrKey: process.env.JWT_REFRESH_SECRET!,
    });
  }

  validate(payload: any) {
    return payload;
  }
}