import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const port: number = +(process.env.PORT ?? '5000');
  // rawBody required for Stripe + WhatsApp webhook signature verification
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const logger = new Logger('HTTP');

  // Simple request logger: method + route + status + duration
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      logger.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`,
      );
    });
    next();
  });
  app.enableCors({
    origin: ['http://localhost:3000'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(port, () => console.log(`Nest server ready at ${port}`));
}

void bootstrap();
