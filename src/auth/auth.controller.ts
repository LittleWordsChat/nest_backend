import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CheckEmailDto } from './dto/checkEmail.dto';
import { LoginDto } from './dto/login.dto';
import { createUserDto } from 'src/users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('check-email')
    async checkEmail(@Body() checkEmailDto: CheckEmailDto) {
        return this.authService.checkEmail(checkEmailDto)
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto)
    }

    @Post('register')
    async register(@Body() createUserDto: createUserDto) {
        return this.authService.register(createUserDto)
    }
}
