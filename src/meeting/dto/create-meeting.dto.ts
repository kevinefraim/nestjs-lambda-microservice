import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  Length,
  IsDate,
  IsArray,
  ArrayNotEmpty,
  IsInt,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMeetingDto {
  @ApiProperty({
    example: 'Team Sync',
    description: 'The title of the meeting',
    minLength: 3,
    maxLength: 50,
  })
  @IsString({ message: 'The title must be a string.' })
  @IsNotEmpty({ message: 'The title is required.' })
  @Length(3, 50, {
    message: 'The title must be between 3 and 50 characters long.',
  })
  title: string;

  @ApiProperty({
    example: 'Weekly team meeting to discuss progress',
    description: 'The description of the meeting',
    minLength: 5,
    maxLength: 500,
  })
  @IsString({ message: 'The description must be a string.' })
  @IsNotEmpty({ message: 'The description is required.' })
  @Length(5, 500, {
    message: 'The description must be between 5 and 500 characters long.',
  })
  description: string;

  @ApiProperty({
    example: 'urn:group:b0694c70-24b6-411e-a5b7-33b5b49f15e6',
    description: 'The URN of the group associated with the meeting',
    required: false,
  })
  @IsString({ message: 'The Group URN must be a string.' })
  @IsOptional()
  group_urn?: string;

  @ApiProperty({
    example: '2024-11-04T15:00:00Z',
    description: 'The start date of the meeting',
    required: false,
  })
  @IsDate({ message: 'The start date must be a valid date.' })
  @Type(() => Date)
  @IsOptional()
  start_at?: Date;

  @ApiProperty({
    example: '2024-11-04T16:30:00Z',
    description: 'The end date of the meeting',
    required: false,
  })
  @IsDate({ message: 'The end date must be a valid date.' })
  @Type(() => Date)
  @IsOptional()
  end_at?: Date;

  @ApiProperty({
    example: 10,
    description: 'The maximum number of participants allowed',
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsInt({ message: 'The maximum number of participants must be an integer.' })
  @Min(1, { message: 'The maximum number of participants must be at least 1.' })
  @Max(100, {
    message: 'The maximum number of participants cannot exceed 100.',
  })
  @IsOptional()
  max_participants?: number;

  @ApiProperty({
    example: ['urn:user:123', 'urn:user:456'],
    description: 'List of user URNs invited to the meeting',
    required: false,
    type: [String],
  })
  @IsArray({ message: 'The users list must be an array.' })
  @ArrayNotEmpty({ message: 'The users list cannot be empty.' })
  @IsOptional()
  @Type(() => String)
  users: string[];
}
