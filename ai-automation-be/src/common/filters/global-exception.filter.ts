import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: string | string[] | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        message =
          typeof resp.message === 'string'
            ? resp.message
            : Array.isArray(resp.message)
              ? (resp.message as string[]).join(', ')
              : String(typeof resp.error === 'string' ? resp.error : 'Error');
        if (Array.isArray(resp.message)) {
          details = resp.message as string[];
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log 5xx errors with stack trace for debugging; 4xx only as warnings
    if (Number(statusCode) >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${statusCode}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} → ${statusCode}: ${message}`,
      );
    }

    response.status(statusCode).json({
      success: false,
      error: {
        statusCode,
        message,
        ...(details ? { details } : {}),
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
