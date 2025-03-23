import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Context } from 'telegraf';
import { Observable, of } from 'rxjs';
import { KeyboardsService } from '../shared/keyboard.service';
import { JwtService } from '@nestjs/jwt';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { SceneContext, WizardContext } from 'telegraf/typings/scenes';

interface Payload {
  userId: string;
  email: string;
  scopes: Array<string>;
  iat: number;
  exp: number;
  aud: Array<string>;
  iss: string;
  sub: string;
  jti: string;
}

@Injectable()
export class AuthInterceptor implements NestInterceptor {
  constructor(
    private readonly keyboard: KeyboardsService,
    private readonly jwtService: JwtService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const telegrafCtx = TelegrafExecutionContext.create(context).getContext<
      Context | WizardContext
    >();

    try {
      // Check if user has an access token
      // @ts-expect-error
      if (!telegrafCtx.session.auth?.access_token) {
        await this.handleUnauthenticated(telegrafCtx);
        return of(null); // Return an empty observable
      }

      // Check if token is expired
      // @ts-expect-error
      const token = telegrafCtx.session.auth.access_token;
      const isExpired = this.isTokenExpired(token);

      if (isExpired) {
        // Leave any current scenes
        // @ts-expect-error
        telegrafCtx.scene?.leave?.();
        await this.handleExpiredToken(telegrafCtx);
        return of(null); // Return an null observable
      }

      // Continue to the next handler
      return next.handle();
    } catch (error) {
      // @ts-expect-error
      telegrafCtx.scene?.leave?.();
      await this.handleUnauthenticated(telegrafCtx);
      return of(null); // Return an null observable
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded = this.jwtService.decode<Payload>(token);

      if (!decoded) return true;

      // Check if token has expired
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        return true;
      }
      return false;
    } catch {
      // If we can't parse the token, consider it expired
      return true;
    }
  }

  private async handleUnauthenticated(
    ctx: Context | WizardContext | SceneContext,
  ): Promise<void> {
    const keyboardMarkup = this.keyboard.getUnauthenticatedKeyboard();
    await ctx.replyWithMarkdownV2(
      '*Authentication Required*\n\nPlease login to continue\\.',
      {
        reply_markup: keyboardMarkup.reply_markup,
      },
    );
  }

  private async handleExpiredToken(
    ctx: Context | WizardContext | SceneContext,
  ): Promise<void> {
    // Clear the expired token
    // @ts-expect-error
    ctx.session.auth = {
      // @ts-expect-error
      email: ctx.session.auth?.email, // Keep email if available
    };

    const keyboardMarkup = this.keyboard.getUnauthenticatedKeyboard();
    await ctx.replyWithMarkdownV2(
      '*Session Expired*\n\nYour session has expired\\. Please login again\\.',
      {
        reply_markup: keyboardMarkup.reply_markup,
      },
    );
  }
}
