import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interfaces.js';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user as AuthenticatedUser;

    if (data) {
      return user[data];
    }

    return user;
  },
);
