import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chunk } from './chunk.entity';
import { Document } from '../documents/document.entity';

@Injectable()
export class ChunksService {
  constructor(
    @InjectRepository(Chunk)
    private readonly chunkRepository: Repository<Chunk>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}

  /**
   * Split text into overlapping chunks of approximately `chunkSize` words
   * with `overlap` words of overlap between consecutive chunks.
   */
  chunkDocument(documentId: string): Promise<Chunk[]> {
    // This method creates chunks from a document's content
    // It's called internally or via the rechunk endpoint
    return this.createChunks(documentId);
  }

  private async createChunks(documentId: string): Promise<Chunk[]> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });
    if (!document) {
      throw new NotFoundException(`Document with id ${documentId} not found`);
    }

    // First, delete existing chunks for this document
    await this.chunkRepository.delete({ documentId });

    const text = document.content;
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const chunkSize = 500;
    const overlap = 50;
    const chunks: Chunk[] = [];

    let index = 0;
    let start = 0;

    while (start < words.length) {
      const end = Math.min(start + chunkSize, words.length);
      const chunkWords = words.slice(start, end);
      const content = chunkWords.join(' ');

      const chunk = this.chunkRepository.create({
        id: crypto.randomUUID(),
        documentId,
        content,
        chunkIndex: index,
        tokenCount: chunkWords.length,
      });

      chunks.push(chunk);
      index++;

      if (end >= words.length) break;

      start = end - overlap;
    }

    return this.chunkRepository.save(chunks);
  }

  async findByDocumentId(documentId: string): Promise<Chunk[]> {
    return this.chunkRepository.find({
      where: { documentId },
      order: { chunkIndex: 'ASC' },
      relations: { document: true },
    });
  }

  async rechunk(documentId: string): Promise<Chunk[]> {
    return this.createChunks(documentId);
  }

  async saveEmbedding(chunkId: string, embedding: number[]): Promise<void> {
    await this.chunkRepository.update(chunkId, {
      embedding: JSON.stringify(embedding),
    });
  }

  async findAllWithEmbeddings(): Promise<Chunk[]> {
    return this.chunkRepository.find({
      where: { embedding: '' },  // This won't work properly, need to find non-null embeddings
    });
  }

  async findChunksWithEmbeddings(documentIds?: string[]): Promise<Chunk[]> {
    const where: any = {};

    // Only find chunks that have non-null, non-empty embeddings
    if (documentIds && documentIds.length > 0) {
      where.documentId = documentIds.length === 1 ? documentIds[0] : { $in: documentIds };
    }

    // TypeORM v1 doesn't support $in the same way; use query builder
    const query = this.chunkRepository
      .createQueryBuilder('chunk')
      .where('chunk.embedding IS NOT NULL')
      .andWhere("chunk.embedding != ''");

    if (documentIds && documentIds.length > 0) {
      query.andWhere('chunk.documentId IN (:...documentIds)', { documentIds });
    }

    return query.orderBy('chunk.chunkIndex', 'ASC').getMany();
  }
}
