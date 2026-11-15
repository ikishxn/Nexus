import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDocument } from './schemas/user.schema';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('top-contributors')
  async getTopContributors(@Query('limit') limit?: number): Promise<UserDocument[]> {
    const parsedLimit = limit ? Math.min(Number(limit), 50) : 10;
    return this.usersService.getTopContributors(parsedLimit);
  }
}

