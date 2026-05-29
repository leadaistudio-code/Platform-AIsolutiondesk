import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { env } from '@aisolutiondesk/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SocialPostsService } from './modules/social/social-posts.service';

/**
 * The application's entry point. Running `pnpm dev` calls this file.
 * It builds the app from AppModule, turns on a few global protections,
 * then starts listening for HTTP requests.
 */
async function bootstrap() {
  // rawBody: true keeps a copy of the unparsed body, which webhook signature
  // verification (Clerk/Stripe) needs.
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  // Only allow our own website to call this API from the browser.
  app.enableCors({ origin: [env.WEB_URL], credentials: true });

  // Catch any unhandled error and return a clean, consistent JSON response.
  app.useGlobalFilters(new AllExceptionsFilter());

  // Note: request bodies are validated per-route with our Zod-based
  // ZodValidationPipe (packages use zod, not class-validator).

  // Auto-generated, interactive API documentation at /docs.
  const config = new DocumentBuilder()
    .setTitle('AISOLUTIONDESK API')
    .setDescription('The AI Workforce Platform API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  // Cloud hosts (Railway/Render) inject PORT; fall back to API_PORT locally.
  const port = process.env.PORT ? Number(process.env.PORT) : env.API_PORT;
  await app.listen(port, '0.0.0.0');
  Logger.log(`API ready on port ${port}`, 'Bootstrap');

  // Scheduled-publish tick: every minute, check for due social posts and
  // publish them. Lives in the API process so a single `pnpm dev` is enough
  // (the standalone worker doesn't need to run for scheduling to work).
  const social = app.get(SocialPostsService);
  const tickMs = 60_000;
  const tick = async () => {
    try {
      await social.publishDueScheduled();
    } catch (err) {
      Logger.error(
        `Scheduled-publish tick failed: ${(err as Error).message}`,
        'SocialScheduler',
      );
    }
  };
  setInterval(tick, tickMs);
  void tick();
  Logger.log(
    `Scheduled-publish tick running every ${tickMs / 1000}s`,
    'SocialScheduler',
  );
}

bootstrap();
