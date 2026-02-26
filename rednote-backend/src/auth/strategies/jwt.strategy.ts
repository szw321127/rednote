import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: {
    sub: string;
    email: string;
    role?: string;
    type?: string;
  }) {
    if (payload.type && payload.type !== 'access') {
      throw new UnauthorizedException('Invalid access token type');
    }

    return { sub: payload.sub, email: payload.email, role: payload.role };
  }
}
