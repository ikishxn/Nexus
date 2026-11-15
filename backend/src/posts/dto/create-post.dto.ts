import { IsEnum, IsString, MaxLength, MinLength, IsOptional, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PostCategory, PostType } from '../schemas/post.schema';

export class ContentPayloadDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  codeSnippet?: string;

  @IsOptional()
  @IsString({ each: true })
  mediaUrls?: string[];
}

export class CreatePostDto {
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title: string;

  @ValidateNested()
  @Type(() => ContentPayloadDto)
  content: ContentPayloadDto;

  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  @IsEnum(PostCategory, { message: 'category must be a valid Quora topic' })
  category: PostCategory;

  @IsOptional()
  @IsEnum(PostType)
  postType?: PostType;

  @IsOptional()
  @IsString()
  threadStyle?: string;

  @IsOptional()
  @IsEnum(['affirmative', 'negative'], { message: 'stance must be either affirmative or negative' })
  stance?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bountyAmount?: number;

  @IsOptional()
  @IsString()
  targetedExpertId?: string;

  @IsOptional()
  @IsString()
  realmId?: string;
}
