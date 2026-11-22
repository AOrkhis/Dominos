import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Store } from '../stores/store.entity.js';

export enum ContestTrend {
  UP = 'up',
  DOWN = 'down',
  SAME = 'same',
}

@Entity('contest_entries')
export class ContestEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** FK to contests.id — plain column, no object relation (avoids circular entity imports). */
  @Column()
  contestId: string;

  @ManyToOne(() => Store, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @Column()
  storeId: number;

  @Column()
  manager: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  upsellRate: number;

  @Column({ type: 'int', default: 0 })
  qualifyingOrders: number;

  @Column({ type: 'enum', enum: ContestTrend, default: ContestTrend.SAME })
  trend: ContestTrend;
}
