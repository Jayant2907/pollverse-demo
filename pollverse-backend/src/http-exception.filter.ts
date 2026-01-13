import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            message: (exception as any).message || 'Internal server error',
            error: 'Internal Server Error',
          };

    // Normalize message
    const message = (items: any) => {
      if (typeof items === 'string') return items;
      if (items && items.message) return items.message;
      return 'Unknown Error';
    };

    console.error(`Status: ${status} Error: ${JSON.stringify(errorResponse)}`);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(typeof errorResponse === 'object'
        ? errorResponse
        : { message: errorResponse }),
    });
  }
}
