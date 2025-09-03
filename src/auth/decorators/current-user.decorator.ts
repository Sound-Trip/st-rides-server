import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user; // populated by JwtAuthGuard

    // Map `sub` to `id` for convenience
    const normalizedUser = { ...user, id: user?.sub };

    return data ? normalizedUser?.[data] : normalizedUser;
  },
);