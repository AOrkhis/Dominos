import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Store } from '../stores/store.entity.js';
import { User } from '../users/user.entity.js';

@Entity('store_assignments')
@Unique(['user', 'store'])
export class StoreAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.assignments, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Store, (s) => s.assignments, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @Column()
  storeId: number;

  /** The admin who made the assignment (null if seeded/system). */
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignedById' })
  assignedBy: User | null;

  @Column({ nullable: true })
  assignedById: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
