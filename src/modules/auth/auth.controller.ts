import {
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
  Body
} from '@nestjs/common';
import { Response, Request } from 'express';

import { AuthService } from './auth.service';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';
import { AccessAuthGuard } from './guards/access-auth.guard';
import { JwtPayload } from './types/jwt-payload.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('refresh')
  @UseGuards(RefreshAuthGuard)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as any;

    // const refreshToken = req.cookies['refresh_token'];
    // const tokens = await this.auth.refreshTokens(user.sub, refreshToken);

    const tokens = await this.auth.refreshTokens(
      user.sub,
      user.refreshToken, // ✅ use token from strategy
    );

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/auth/refresh',
    });

    return { accessToken: tokens.accessToken };
  }

 @Post('login')
async login(
  @Body() body: { email: string; password: string },
  @Res({ passthrough: true }) res: Response,
) {
  const tokens = await this.auth.login(body.email,
      body.password,);

  res.cookie('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/auth/refresh', // <--- Add this line to match your refresh method
  });

  return { accessToken: tokens.accessToken };
}

  @Post('logout')
  @UseGuards(AccessAuthGuard)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as JwtPayload;

    await this.auth.logout(user.sub);
    res.clearCookie('refresh_token');

    return { success: true };
  }
}
