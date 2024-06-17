import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Module, UnauthorizedException } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

@Catch(UnauthorizedException)
export class UnauthorizedExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.UNAUTHORIZED
    const exceptionResponse = exception.getResponse() as any

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exceptionResponse.message,
      logout: exceptionResponse.logout,
    })
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env'
    }),
    AuthModule,
    MongooseModule.forRoot(process.env.MONGODB_URI, {

    }),
    UsersModule
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: UnauthorizedExceptionFilter,
    }
  ],
})
export class AppModule { }
