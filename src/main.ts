import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS for the frontend
  app.enableCors({
    origin: '*',
  });

  // Set the global prefix for the API
  app.setGlobalPrefix('api');

  // Enable versioning for the API
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Enable security features
  app.use(helmet());

  // Enable compression
  app.use(compression());

  // Enable graceful shutdown for the application
  app.enableShutdownHooks();

  // Enable validation pipe for request validation
  app.useGlobalPipes(new ValidationPipe());

  // Set the port for the application
  // default port is 3000
  const port = configService.get<number>('PORT') || 3000;

  // Start the application
  await app.listen(port, '0.0.0.0');
}
bootstrap();
