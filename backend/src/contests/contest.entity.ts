import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ContestEntry } from './contest-entry.entity.js';

@Entity('contests')
export class Contest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  product: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'text' })
  intro: string;

  @Column({ type: 'text' })
  teamPrize: string;

  @Column({ type: 'text' })
  storePrize: string;

  @Column({ type: 'int', nullable: true })
  winner1StoreId: number | null;

  @Column({ type: 'int', nullable: true })
  winner2StoreId: number | null;

  @Column({ type: 'int', nullable: true })
  winner3StoreId: number | null;

  @Column({ default: true })
  isActive: boolean;

  /** Populated by the service — not a mapped relation (keeps entities acyclic). */
  entries: ContestEntry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
