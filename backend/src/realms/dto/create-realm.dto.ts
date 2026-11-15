import { IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class CreateRealmDto {
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[a-z0-9_]+$/, { message: 'name must be lowercase, no spaces, only letters/numbers/underscores' })
  name: string;

  @IsString()
  @MinLength(3)
  @MaxLength(60)
  displayName: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  themeColor?: string;
}
