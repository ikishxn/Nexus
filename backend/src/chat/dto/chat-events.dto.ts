import { IsString, MaxLength, MinLength } from 'class-validator';

export class JoinContextRoomDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  contextRef: string;
}

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  contextRef: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body: string;
}
