import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CheckEmailDto } from './dto/checkEmail.dto';
import { LoginDto } from './dto/login.dto';
import { createUserDto } from 'src/users/dto/create-user.dto';
import { Response } from 'express';

@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('email')
    async checkEmail(@Body() checkEmailDto: CheckEmailDto, @Res() res: Response) {
        const result = await this.authService.checkEmail(checkEmailDto)
        if (result.status === 400)
            return res.status(HttpStatus.NOT_FOUND).json(result)
        return res.status(HttpStatus.OK).json(result)
    }

    @Post('password')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto)
    }

    @Post('register')
    async register(@Body() createUserDto: createUserDto) {
        return this.authService.register(createUserDto)
    }
}
