import { NestFactory } from "@nestjs/core"
import { ValidationPipe } from "@nestjs/common"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })

  // API versioning
  app.setGlobalPrefix("api/v1")

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("Ride Booking API")
    .setDescription("A comprehensive ride booking platform API")
    .setVersion("1.0")
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("api/docs", app, document)

  const port = process.env.PORT || 3000
  await app.listen(port)

  console.log(`🚀 Application is running on: http://localhost:${port}`)
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`)
}

bootstrap()
