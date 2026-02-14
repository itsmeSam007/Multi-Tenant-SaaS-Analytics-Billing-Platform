import {
  Controller,
  Get,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { AccessAuthGuard } from '../auth/guards/access-auth.guard';
import { Request } from 'express';

@Controller('admin')
export class AdminController {
  @Get()
  @UseGuards(AccessAuthGuard)
  getAdmin(@Req() req: Request) {
    const user = req.user as any;

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException();
    }

    return { message: 'Admin OK' };
  }
}
