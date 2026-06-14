import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { Chunk } from '../chunks/chunk.entity';
import { Document } from '../documents/document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chunk, Document])],
  controllers: [RagController],
  providers: [RagService],
  exports: [RagService],
})
export class RagModule {}
