import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({ example: 'Introduction to Angular Signals' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Angular Signals is a new reactive...' })
  @IsString()
  content: string;

  @ApiProperty({ example: 'paste', enum: ['upload', 'paste', 'url'] })
  @IsString()
  @IsIn(['upload', 'paste', 'url'])
  source: string;
}
