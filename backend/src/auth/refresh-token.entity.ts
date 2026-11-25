import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/** Rotating refresh tokens, as required by @nestjs/authentication's RefreshTokenStore. */
@Entity('refresh_tokens')
export class RefreshToken {
  /** SHA-256 of the token — the primary key. */
  @PrimaryColumn()
  id: string;

  /** Every rotation stays in the family of the original sign-in. */
  @Index()
  @Column()
  familyId: string;

  @Index()
  @Column()
  userId: string;

  @Column({ type: 'datetime' })
  createdAt: Date;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  /** The family cannot be extended past this, however often it rotates. */
  @Index()
  @Column({ type: 'datetime' })
  familyExpiresAt: Date;

  @Column({ type: 'datetime', nullable: true })
  usedAt: Date | null;

  @Column({ type: 'json', nullable: true })
  claims: Record<string, unknown> | null;
}

/**
 * Revoked token families — a row outlives the tokens, so a refresh that
 * loses the race to a reuse still lands in a revoked family.
 */
@Entity('revoked_refresh_families')
export class RevokedRefreshFamily {
  @PrimaryColumn()
  familyId: string;

  @Column({ type: 'datetime' })
  revokedAt: Date;
}
