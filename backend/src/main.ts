import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(helmet());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // server-to-server requests
      const allowed = (process.env.FRONTEND_URL || 'http://localhost:5173')
        .split(',')
        .map((u) => u.trim());
      const ok =
        allowed.includes(origin) ||
        origin.endsWith('.railway.app') ||
        origin.endsWith('.vercel.app') ||
        origin === 'http://localhost:5173';
      callback(ok ? null : new Error('Not allowed by CORS'), ok);
    },
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Barbearia do Gustavo - API')
      .setDescription('Sistema de gestão de barbearia')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application running on http://localhost:${port}/api`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger docs: http://localhost:${port}/api/docs`);
  }
}
bootstrap();
