import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatPartDto {
  @IsString()
  text: string;
}

export class ChatHistoryItemDto {
  @IsString()
  role: 'user' | 'model';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatPartDto)
  parts: ChatPartDto[];
}

export class ChatAiDto {
  @IsOptional()
  @IsString()
  postId?: string;

  @IsOptional()
  @IsString()
  postContext?: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItemDto)
  history?: ChatHistoryItemDto[];
}
