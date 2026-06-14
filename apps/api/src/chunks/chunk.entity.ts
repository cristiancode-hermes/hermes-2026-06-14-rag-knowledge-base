import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Document } from '../documents/document.entity';

@Entity('chunks')
export class Chunk {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  documentId: string;

  @ManyToOne(() => Document, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document: Document;

  @Column('text')
  content: string;

  @Column('int')
  chunkIndex: number;

  @Column('int', { default: 0 })
  tokenCount: number;

  @Column('text', { nullable: true })
  embedding: string;

  @CreateDateColumn()
  createdAt: Date;
}
