import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { RagService } from './rag.service';
import { QueryDto } from './dto/query.dto';
import { AnswerResponseDto } from './dto/answer-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('rag')
@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('query')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Query the RAG system with a question' })
  async query(@Body() dto: QueryDto): Promise<AnswerResponseDto> {
    const topK = dto.topK ?? 5;
    const chunks = await this.ragService.retrieveRelevantChunks(
      dto.question,
      topK,
      dto.documentIds,
    );
    return this.ragService.generateAnswer(dto.question, chunks);
  }
}
