import { IsString, MinLength, IsOptional, IsBoolean, IsNumber, Min, Max, IsArray } from 'class-validator';

export class UploadTrackDto {
  @IsString({ message: 'Title must be a string' })
  @MinLength(1, { message: 'Title is required' })
  title!: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsString({ message: 'Genre must be a string' })
  @MinLength(1, { message: 'Genre is required' })
  genre!: string;

  @IsOptional()
  @IsString({ message: 'Sub-genre must be a string' })
  subGenre?: string;

  @IsOptional()
  @IsNumber({}, { message: 'BPM must be a number' })
  @Min(60, { message: 'BPM must be at least 60' })
  @Max(300, { message: 'BPM must be at most 300' })
  bpm?: number;

  @IsOptional()
  @IsString({ message: 'Key signature must be a string' })
  keySignature?: string;

  @IsOptional()
  isExplicit?: boolean | string;

  @IsOptional()
  tags?: string[] | string;
}

export class GetTracksDto {
  @IsOptional()
  @IsString({ message: 'Genre must be a string' })
  genre?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must be at most 100' })
  limit?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Offset must be a number' })
  @Min(0, { message: 'Offset must be at least 0' })
  offset?: number;
}