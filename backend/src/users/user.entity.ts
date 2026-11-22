import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StoreAssignment } from '../assignments/store-assignment.entity.js';

export enum UserRole {
  /** Sees and manages everything across the platform. */
  SUPER_ADMIN = 'super_admin',
  /** Sees all stores; assigns stores to supervisors and users. */
  ADMIN = 'admin',
  /** Can be assigned to multiple stores. */
  SUPERVISOR = 'supervisor',
  /** Can be assigned to exactly one store. */
  USER = 'user',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => StoreAssignment, (a) => a.user)
  assignments: StoreAssignment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
