import { IsString, MinLength, IsOptional, IsArray, ArrayMaxSize } from 'class-validator';

export class CreateArtistDto {
  @IsString({ message: 'Stage name must be a string' })
  @MinLength(1, { message: 'Stage name is required' })
  stageName!: string;

  @IsOptional()
  @IsString({ message: 'Bio must be a string' })
  bio?: string;

  @IsOptional()
  @IsArray({ message: 'Genres must be an array' })
  @ArrayMaxSize(10, { message: 'Maximum 10 genres allowed' })
  @IsString({ each: true, message: 'Each genre must be a string' })
  genres?: string[];
}