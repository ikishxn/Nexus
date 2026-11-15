import { Body, Controller, Get, Param, Patch, Post as HttpPost, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { RealmsService } from './realms.service';
import { CreateRealmDto } from './dto/create-realm.dto';

@Controller('realms')
export class RealmsController {
  constructor(private readonly realmsService: RealmsService) {}

  @UseGuards(JwtAuthGuard)
  @HttpPost()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRealmDto) {
    return this.realmsService.create(user.userId, dto);
  }

  @Get()
  async findAll() {
    return this.realmsService.findAll();
  }

  @Get(':name')
  async findOne(@Param('name') name: string) {
    return this.realmsService.findByName(name);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':name')
  async update(
    @Param('name') name: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { description?: string; themeColor?: string; displayName?: string },
  ) {
    return this.realmsService.update(name, user.userId, body);
  }
}
