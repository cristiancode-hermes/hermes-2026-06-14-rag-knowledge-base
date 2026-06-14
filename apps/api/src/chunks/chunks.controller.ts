import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChunksService } from './chunks.service';
import { Chunk } from './chunk.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('chunks')
@Controller('documents/:documentId/chunks')
export class ChunksController {
  constructor(private readonly chunksService: ChunksService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all chunks for a document' })
  async findByDocumentId(
    @Param('documentId') documentId: string,
  ): Promise<Chunk[]> {
    return this.chunksService.findByDocumentId(documentId);
  }

  @Post('rechunk')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Re-chunk a document (deletes existing chunks and re-generates)' })
  async rechunk(
    @Param('documentId') documentId: string,
  ): Promise<Chunk[]> {
    return this.chunksService.rechunk(documentId);
  }
}
