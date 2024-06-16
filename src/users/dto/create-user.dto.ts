import { IsEmail, IsNotEmpty, MinLength } from 'class-validator'

export class createUserDto {
    @IsNotEmpty()
    readonly name: string;

    @IsEmail()
    @IsNotEmpty()
    readonly email: string;

    @MinLength(8)
    @IsNotEmpty()
    readonly password: string;

    readonly profile_picture: string;
}