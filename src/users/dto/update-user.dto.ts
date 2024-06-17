import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateUserDto {

    @IsOptional()
    @IsString()
    readonly name?: string

    @IsOptional()
    @IsString()
    readonly profile_pic?: string
}