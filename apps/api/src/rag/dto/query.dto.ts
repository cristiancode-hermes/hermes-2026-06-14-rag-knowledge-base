import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, Min } from 'class-validator';

export class QueryDto {
  @ApiProperty({ example: 'What are Angular Signals?' })
  @IsString()
  question: string;

  @ApiPropertyOptional({ example: ['doc-uuid-1', 'doc-uuid-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentIds?: string[];

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  topK?: number;
}
