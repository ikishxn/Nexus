import { IsNumber, IsOptional, Min } from 'class-validator';

export class BuyCreditsDto {
  @IsOptional()
  @IsNumber()
  @Min(100)
  amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  credits?: number;
}

