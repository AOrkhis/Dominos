import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StoreAssignment } from '../assignments/store-assignment.entity.js';

@Entity('stores')
export class Store {
  /** The real Domino's store number (e.g. 10600). */
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  region: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => StoreAssignment, (a) => a.store)
  assignments: StoreAssignment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
