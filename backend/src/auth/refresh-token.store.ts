import { Injectable } from '@nestjs/common';
import {
  AuthenticationStorage,
  type RefreshTokenRecord,
  type RefreshTokenStore,
} from '@nestjs/authentication';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Repository } from 'typeorm';
import {
  RefreshToken,
  RevokedRefreshFamily,
} from './refresh-token.entity.js';

/**
 * MySQL-backed RefreshTokenStore — survives restarts and is shared by
 * every instance. Follows the store contract: used-marking is a single
 * conditional UPDATE, and family revocation is a separate table so
 * tokens saved after a revoke are still covered.
 */
@Injectable()
export class TypeormRefreshTokenStore implements RefreshTokenStore {
  constructor(
    storage: AuthenticationStorage,
    @InjectRepository(RefreshToken)
    private readonly tokens: Repository<RefreshToken>,
    @InjectRepository(RevokedRefreshFamily)
    private readonly revoked: Repository<RevokedRefreshFamily>,
  ) {
    storage.registerSource({ refreshTokens: this });
  }

  async getRefreshToken(id: string): Promise<RefreshTokenRecord | undefined> {
    const row = await this.tokens.findOne({ where: { id } });
    if (!row) return undefined;
    return {
      id: row.id,
      familyId: row.familyId,
      userId: row.userId,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      familyExpiresAt: row.familyExpiresAt,
      usedAt: row.usedAt ?? undefined,
      claims: row.claims ?? undefined,
    };
  }

  async saveRefreshToken(record: RefreshTokenRecord): Promise<void> {
    // Bound the table: families past their absolute expiry can no longer
    // rotate, so the tokens — and their revocation — no longer matter.
    const now = new Date();
    await this.tokens.delete({ familyExpiresAt: LessThan(now) });
    await this.revoked.delete({ revokedAt: LessThan(this.revokeHorizon()) });
    await this.tokens.save(this.tokens.create({ ...record, usedAt: record.usedAt ?? null, claims: record.claims ?? null }));
  }

  /** One conditional write — exactly one concurrent caller wins. */
  async markRefreshTokenUsed(id: string, at: Date): Promise<boolean> {
    const result = await this.tokens.update(
      { id, usedAt: IsNull() },
      { usedAt: at },
    );
    return result.affected === 1;
  }

  async revokeRefreshTokenFamily(familyId: string): Promise<void> {
    await this.revoked
      .createQueryBuilder()
      .insert()
      .values({ familyId, revokedAt: new Date() })
      .orIgnore()
      .execute();
  }

  async isRefreshTokenFamilyRevoked(familyId: string): Promise<boolean> {
    return this.revoked.exists({ where: { familyId } });
  }

  async revokeUserRefreshTokens(userId: string): Promise<void> {
    const families = await this.tokens
      .createQueryBuilder('t')
      .select('DISTINCT t.familyId', 'familyId')
      .where('t.userId = :userId', { userId })
      .getRawMany<{ familyId: string }>();
    if (!families.length) return;
    await this.revoked
      .createQueryBuilder()
      .insert()
      .values(
        families.map((f) => ({ familyId: f.familyId, revokedAt: new Date() })),
      )
      .orIgnore()
      .execute();
  }

  /**
   * Revocation rows outlive their tokens only; 90 days covers any family
   * whose absolute expiry was still in the future when it was revoked.
   */
  private revokeHorizon(): Date {
    return new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  }
}
