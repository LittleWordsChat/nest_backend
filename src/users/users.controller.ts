import { Body, Controller, Get, HttpStatus, Put, Req, Res, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guards';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller()
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @UseGuards(JwtAuthGuard)
    @Get('user-details')
    async getUser(@Req() req: Request, @Res() res: Response) {
        const userId = req.user['_id']
        const user = await this.usersService.findOneById(userId)
        if (!user)
            return res.status(HttpStatus.NOT_FOUND)
        return res.status(HttpStatus.OK).json(user)
    }

    @UseGuards(JwtAuthGuard)
    @Put('update-user')
    async updateUser(
        @Req() req: Request,
        @Body() updateUserDto: UpdateUserDto,
        @Res() res: Response) {
        const userId = req.user['_id']
        const updatedUser = await this.usersService.update(userId, updateUserDto)
        return res.json(HttpStatus.NO_CONTENT).send()
    }

}
