import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT guard - does not reject unauthenticated requests,
 * but attaches user info if a valid token is present.
 */
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    // Don't throw on missing/invalid token, just return null
    return user || null;
  }
}
