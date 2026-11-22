import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../users/user.entity.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const ADMIN_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

/**
 * Runs after the global authentication guard, which already put the
 * authenticated user on `request.user` (and rejected anonymous calls to
 * non-@Public routes). @Public routes should not also declare @Roles.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const { user } = context.switchToHttp().getRequest<{ user?: { role: UserRole } }>();
    if (!user) throw new UnauthorizedException();
    if (!roles.includes(user.role))
      throw new ForbiddenException('This action requires a higher role');
    return true;
  }
}
