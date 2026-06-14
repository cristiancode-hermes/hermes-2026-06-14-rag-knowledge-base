import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';
import { Document } from '../documents/document.entity';
import { Chunk } from '../chunks/chunk.entity';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [TypeOrmModule.forFeature([Document, Chunk]), RagModule],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}
