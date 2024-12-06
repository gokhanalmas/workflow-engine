import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Body('userId') userId: string) {
    return this.usersService.findById(userId);
  }

  @Post()
  create(@Body() userData: Partial<User>) {
    return this.usersService.create(userData);
  }
}