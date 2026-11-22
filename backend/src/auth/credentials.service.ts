import { Injectable } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity.js';

@Injectable()
export class CredentialsService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  /** The user, or null when the email or the password is wrong. */
  async verify(email: string, password: string): Promise<User | null> {
    const found = await this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email: email.trim().toLowerCase() })
      .getOne();
    // No account: verify() checks a dummy hash so timing doesn't reveal registered emails.
    const valid = await this.passwordHasher.verify(
      password,
      found?.passwordHash,
    );
    if (!valid || !found || !found.isActive) return null;
    if (this.passwordHasher.needsRehash(found.passwordHash)) {
      found.passwordHash = await this.passwordHasher.hash(password);
      await this.users.save(found);
    }
    delete (found as Partial<User>).passwordHash;
    return found;
  }
}
