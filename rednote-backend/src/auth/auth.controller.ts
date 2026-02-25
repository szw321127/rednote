import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body(ValidationPipe) dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body(ValidationPipe) dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  refresh(@Request() req: any) {
    return this.authService.refreshToken(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.sub);
  }
}
