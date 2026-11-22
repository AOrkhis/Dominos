import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  app.enableCors(); // dev — the Vite dev server runs on another port
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
