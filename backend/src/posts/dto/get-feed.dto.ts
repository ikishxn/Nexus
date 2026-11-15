import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min, IsString } from 'class-validator';
import { PostCategory } from '../schemas/post.schema';

export class GetFeedDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  _t?: string | number;

  @IsOptional()
  @IsString()
  realmId?: string;

  @IsOptional()
  @IsString()
  realmName?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
