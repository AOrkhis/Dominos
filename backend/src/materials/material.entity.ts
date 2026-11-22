import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MaterialCategory {
  UPSELL = 'upsell',
  SIGNAGE = 'signage',
  ONLINE = 'online',
  VISIBILITY = 'visibility',
  LSM = 'lsm',
  IN_STORE = 'in_store',
}

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  detail: string;

  /** e.g. "5 days" — production turnaround shown to requesters. */
  @Column()
  leadTime: string;

  @Column({ type: 'enum', enum: MaterialCategory })
  category: MaterialCategory;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
