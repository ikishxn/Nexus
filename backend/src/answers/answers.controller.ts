import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { AnswersService } from './answers.service';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { AnswerDocument } from './schemas/answer.schema';

@Controller('answers')
export class AnswersController {
  constructor(private readonly answersService: AnswersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAnswerDto,
  ): Promise<AnswerDocument> {
    return this.answersService.create(user.userId, dto);
  }

  @Get('post/:postId')
  async getAnswersForPost(@Param('postId') postId: string): Promise<AnswerDocument[]> {
    return this.answersService.getAnswersForPost(postId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  async acceptAnswer(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AnswerDocument> {
    return this.answersService.acceptAnswer(id, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/upvote')
  @HttpCode(HttpStatus.OK)
  async upvote(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AnswerDocument> {
    return this.answersService.upvote(id, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/downvote')
  @HttpCode(HttpStatus.OK)
  async downvote(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AnswerDocument> {
    return this.answersService.downvote(id, user.userId);
  }
}
