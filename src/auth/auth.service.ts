import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { CheckEmailDto } from './dto/checkEmail.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt'
import { createUserDto } from 'src/users/dto/create-user.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    async checkEmail(checkEmailDto: CheckEmailDto) {
        const { email } = checkEmailDto
        const user = await this.usersService.findByEmail(email)
        if (!user) {
            return {
                status: 400,
                message: 'User not exist',
                error: true,
            }
        }
        return {
            status: 200,
            message: 'Email Verify',
            success: true,
            data: user,
        }
    }

    async login(loginDto: LoginDto) {
        const { userId, password } = loginDto
        const user = await this.usersService.findById(userId)
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return {
                status: 400,
                message: 'Invalid credentials',
                error: true,
            }
        }
        const payload = { username: user.email, sub: user._id }
        const token = this.jwtService.sign(payload)
        return {
            status: 200,
            message: 'Login successful',
            success: true,
            data: { access_token: token },
        }
    }

    async register(createUserDto: createUserDto) {
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10)
        const newUser = await this.usersService.create({
            ...createUserDto,
            password: hashedPassword,
        })
        return {
            status: 201,
            message: 'Registration successful',
            success: true,
        }
    }
}
