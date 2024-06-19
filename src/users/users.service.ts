import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { createUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: createUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findByEmail(email: string): Promise<User> {
    return await this.userModel.findOne({ email }).select('-password');
  }

  async findById(userId: string): Promise<User> {
    return await this.userModel.findById(userId);
  }

  async findOneById(userId: string): Promise<User> {
    return await this.userModel.findById(userId).select('-password');
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.findOneById(id);
    if (!existingUser)
      throw new NotFoundException(`User with ID ${id} not found`);
    Object.assign(existingUser, updateUserDto);
    return existingUser.save();
  }

  async searchUser(search: any) {
    const query = new RegExp(search, 'i');
    return await this.userModel
      .find({
        $or: [{ name: query }, { email: query }],
      })
      .select('-password')
      .exec();
  }
}
