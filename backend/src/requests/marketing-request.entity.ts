import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from '../stores/store.entity.js';

export enum RequestStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

@Entity('marketing_requests')
export class MarketingRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Store, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @Column()
  storeId: number;

  @Column({ type: 'varchar', nullable: true })
  contact: string | null;

  @Column({ type: 'date', nullable: true })
  neededBy: string | null;

  /** Selected material names, e.g. ["Upsell Poster","Window Cling"]. */
  @Column({ type: 'json' })
  items: string[];

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.NEW })
  status: RequestStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
