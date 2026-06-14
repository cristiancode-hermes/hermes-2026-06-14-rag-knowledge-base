import { ApiProperty } from '@nestjs/swagger';

class CitationDto {
  @ApiProperty()
  chunkId: string;

  @ApiProperty()
  documentTitle: string;

  @ApiProperty()
  excerpt: string;

  @ApiProperty()
  relevanceScore: number;
}

export class AnswerResponseDto {
  @ApiProperty()
  question: string;

  @ApiProperty()
  answer: string;

  @ApiProperty({ type: [CitationDto] })
  citations: CitationDto[];
}
