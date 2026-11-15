import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateAnswerDto {
  @IsString()
  @IsNotEmpty()
  postId: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  audioNoteUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];
}
