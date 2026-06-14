import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chunk } from '../chunks/chunk.entity';
import { Document } from '../documents/document.entity';
import { QueryDto } from './dto/query.dto';
import { AnswerResponseDto } from './dto/answer-response.dto';

@Injectable()
export class RagService {
  private readonly DIMENSION = 100;

  constructor(
    @InjectRepository(Chunk)
    private readonly chunkRepository: Repository<Chunk>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}

  /**
   * Simple TF-IDF-like vectorizer using a hashing trick.
   * Creates a fixed-dimension vector from word n-gram frequencies.
   */
  embedText(text: string): number[] {
    const lower = text.toLowerCase();
    const words = lower.split(/[^a-z0-9]+/).filter((w) => w.length > 0);

    const vector = new Array(this.DIMENSION).fill(0);

    for (const word of words) {
      // Hashing trick: map word to a fixed dimension index
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (hash * 31 + word.charCodeAt(i)) & 0x7fffffff;
      }
      const index = hash % this.DIMENSION;
      // Simple TF count (log-scaled would be better but keeping simple)
      vector[index] += 1;
    }

    // Add bigram features for better semantic capture
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = words[i] + '_' + words[i + 1];
      let hash = 0;
      for (let j = 0; j < bigram.length; j++) {
        hash = (hash * 31 + bigram.charCodeAt(j)) & 0x7fffffff;
      }
      const index = hash % this.DIMENSION;
      vector[index] += 0.5; // Lower weight for bigrams
    }

    // Normalize the vector to unit length
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude > 0) {
      for (let i = 0; i < this.DIMENSION; i++) {
        vector[i] /= magnitude;
      }
    }

    return vector;
  }

  /**
   * Compute cosine similarity between two vectors.
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    const denom = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
    if (denom === 0) return 0;

    return dotProduct / denom;
  }

  /**
   * Retrieve chunks relevant to the question using embedding similarity.
   */
  async retrieveRelevantChunks(
    question: string,
    topK: number = 5,
    documentIds?: string[],
  ): Promise<Chunk[]> {
    const queryEmbedding = this.embedText(question);

    // Build query for chunks with embeddings
    const query = this.chunkRepository
      .createQueryBuilder('chunk')
      .leftJoinAndSelect('chunk.document', 'document')
      .where('chunk.embedding IS NOT NULL')
      .andWhere("chunk.embedding != ''");

    if (documentIds && documentIds.length > 0) {
      query.andWhere('chunk.documentId IN (:...documentIds)', { documentIds });
    }

    const chunks = await query.getMany();

    // Calculate similarities and rank
    const scored: { chunk: Chunk; score: number }[] = chunks
      .map((chunk) => {
        let chunkEmbedding: number[];
        try {
          chunkEmbedding = JSON.parse(chunk.embedding);
        } catch {
          chunkEmbedding = [];
        }
        const score = chunkEmbedding.length > 0
          ? this.cosineSimilarity(queryEmbedding, chunkEmbedding)
          : 0;
        return { chunk, score };
      })
      .filter((c) => c.score > 0);

    // Sort by score descending and take topK
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map((s) => s.chunk);
  }

  /**
   * Generate an answer from the question and relevant chunks.
   */
  async generateAnswer(
    question: string,
    chunks: Chunk[],
  ): Promise<AnswerResponseDto> {
    if (chunks.length === 0) {
      return {
        question,
        answer: 'No relevant information found to answer this question.',
        citations: [],
      };
    }

    // Build a simple extractive answer by concatenating relevant excerpts
    const contextParts: string[] = [];
    const citations: {
      chunkId: string;
      documentTitle: string;
      excerpt: string;
      relevanceScore: number;
    }[] = [];

    for (const chunk of chunks) {
      // Compute relevance score
      const queryEmbedding = this.embedText(question);
      let chunkEmbedding: number[];
      try {
        chunkEmbedding = JSON.parse(chunk.embedding);
      } catch {
        chunkEmbedding = [];
      }
      const score = chunkEmbedding.length > 0
        ? this.cosineSimilarity(queryEmbedding, chunkEmbedding)
        : 0;

      const title = chunk.document?.title || 'Unknown Document';
      contextParts.push(`[${title}] ${chunk.content}`);
      citations.push({
        chunkId: chunk.id,
        documentTitle: title,
        excerpt: chunk.content.substring(0, 200) + (chunk.content.length > 200 ? '...' : ''),
        relevanceScore: score,
      });
    }

    // Generate answer: combine top chunks into a coherent answer
    const topChunks = chunks.slice(0, 3);
    const answer = this.synthesizeAnswer(question, topChunks);

    return {
      question,
      answer,
      citations,
    };
  }

  /**
   * Synthesize a human-readable answer from the top relevant chunks.
   */
  private synthesizeAnswer(question: string, chunks: Chunk[]): string {
    const documentTitles = Array.from(
      new Set(chunks.map((c) => c.document?.title).filter(Boolean)),
    );

    const excerpts = chunks.map(
      (c) => c.content.substring(0, 300),
    );

    const answerParts: string[] = [];
    answerParts.push(
      `Based on the retrieved information${documentTitles.length > 0 ? ` from ${documentTitles.join(', ')}` : ''}:`,
    );
    answerParts.push('');
    answerParts.push(excerpts.join('\n\n---\n\n'));

    return answerParts.join('\n');
  }
}
