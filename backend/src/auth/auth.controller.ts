import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CurrentUser,
  Public,
  TokenService,
} from '@nestjs/authentication';
import { CredentialsService } from './credentials.service.js';
import { User } from '../users/user.entity.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly credentials: CredentialsService,
    private readonly tokens: TokenService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { email?: string; password?: string }) {
    if (!body.email || !body.password)
      throw new UnauthorizedException('Invalid email or password');
    const user = await this.credentials.verify(body.email, body.password);
    if (!user) throw new UnauthorizedException('Invalid email or password');
    const tokens = await this.tokens.issue(user.id, { method: 'password' });
    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.tokens.refresh(refreshToken);
  }

  @Get('me')
  me(@CurrentUser() user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body('refreshToken') refreshToken?: string) {
    if (refreshToken) await this.tokens.revoke(refreshToken);
  }
}
