import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ApiErrorPayload {
  code: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  details?: unknown;
  retryable?: boolean;
}

interface HttpExceptionResponseBody {
  code?: string;
  message?: string | string[];
  error?: string;
  details?: unknown;
  retryable?: boolean;
}

const STATUS_TO_ERROR_CODE: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
  [HttpStatus.BAD_GATEWAY]: 'BAD_GATEWAY',
  [HttpStatus.GATEWAY_TIMEOUT]: 'GATEWAY_TIMEOUT',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const payload = this.normalizeException(exception, request.url);

    if (payload.statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${payload.statusCode} ${payload.code}: ${payload.message}`,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} -> ${payload.statusCode} ${payload.code}: ${payload.message}`,
      );
    }

    response.status(payload.statusCode).json(payload);
  }

  private normalizeException(
    exception: unknown,
    path: string,
  ): ApiErrorPayload {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();
      const normalizedResponse = this.normalizeHttpExceptionResponse(response);

      return {
        code: normalizedResponse.code || this.mapStatusToErrorCode(statusCode),
        message: normalizedResponse.message,
        statusCode,
        timestamp: new Date().toISOString(),
        path,
        ...(normalizedResponse.details !== undefined
          ? { details: normalizedResponse.details }
          : {}),
        ...(normalizedResponse.retryable !== undefined
          ? { retryable: normalizedResponse.retryable }
          : {}),
      };
    }

    return {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      path,
    };
  }

  private normalizeHttpExceptionResponse(
    response: string | object,
  ): HttpExceptionResponseBody & { message: string } {
    if (typeof response === 'string') {
      return { message: response };
    }

    const body = response as HttpExceptionResponseBody;
    const rawMessage = body.message;

    if (Array.isArray(rawMessage)) {
      return {
        ...body,
        message: 'Request validation failed',
        details: body.details ?? { validationErrors: rawMessage },
      };
    }

    if (typeof rawMessage === 'string' && rawMessage.trim()) {
      return {
        ...body,
        message: rawMessage,
      };
    }

    if (typeof body.error === 'string' && body.error.trim()) {
      return {
        ...body,
        message: body.error,
      };
    }

    return {
      ...body,
      message: 'Request failed',
    };
  }

  private mapStatusToErrorCode(status: number): string {
    return STATUS_TO_ERROR_CODE[status] || `HTTP_${status}`;
  }
}
