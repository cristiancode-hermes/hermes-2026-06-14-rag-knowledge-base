import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChunksController } from './chunks.controller';
import { ChunksService } from './chunks.service';
import { Chunk } from './chunk.entity';
import { Document } from '../documents/document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chunk, Document])],
  controllers: [ChunksController],
  providers: [ChunksService],
  exports: [ChunksService],
})
export class ChunksModule {}
