import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  logger.error('Unhandled Server Error:', err.stack || err.message);

  sendError(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error occurred' : err.message,
    500,
    'INTERNAL_SERVER_ERROR'
  );
}

