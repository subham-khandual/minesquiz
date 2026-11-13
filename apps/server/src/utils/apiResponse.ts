import { Response } from 'express';
import { ApiResponse } from '@mines-quiz/types';

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  code = 'BAD_REQUEST',
  details?: unknown
): void {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
  res.status(statusCode).json(response);
}

