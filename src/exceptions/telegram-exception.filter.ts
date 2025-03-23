import { Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { TelegramError } from 'telegraf';

@Catch(TelegramError)
export class TelegramExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TelegramExceptionFilter.name);

  catch(exception: TelegramError) {
    this.logger.log('Telegram exception');
    this.logger.error(exception.name);
    this.logger.error(exception.message);
    this.logger.error(exception.description);
    this.logger.log(exception);
  }
}
