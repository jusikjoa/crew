import { IsEmail, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;
}