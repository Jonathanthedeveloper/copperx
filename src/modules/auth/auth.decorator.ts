import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { AuthInterceptor } from './auth.interceptor'; // We'll create this next

export const RequireAuth = () => {
  return applyDecorators(UseInterceptors(AuthInterceptor));
};
