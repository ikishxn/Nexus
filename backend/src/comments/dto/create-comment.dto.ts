import { IsMongoId, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsMongoId()
  postId: string;

  @IsOptional()
  @IsMongoId()
  parentCommentId?: string;

  @IsOptional()
  @IsMongoId()
  parentId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(3000)
  body: string;
}
