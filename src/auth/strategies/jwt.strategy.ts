import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';
import { JwtPayload } from './../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET_KEY,
    });
  }

  async validate(payload: JwtPayload) {
    try {
      const user = await this.usersService.findOneById(payload.sub);
      if (!user)
        throw new UnauthorizedException({
          message: 'Invalid token',
          logout: true,
        });
      return user;
    } catch (error) {
      if (error.name === 'TokenExpiredError')
        throw new UnauthorizedException({
          message: 'Session Out',
          logout: true,
        });
      throw new UnauthorizedException({
        message: 'Invalid token',
        logout: true,
      });
    }
  }
}
