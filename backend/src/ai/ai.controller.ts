import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AiService } from './ai.service';
import { ChatAiDto } from './dto/chat-ai.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body() body: ChatAiDto): Promise<{ text: string }> {
    const text = await this.aiService.generateChatResponse(
      body.postId,
      body.postContext,
      body.message,
      body.history,
    );
    return { text };
  }
}

