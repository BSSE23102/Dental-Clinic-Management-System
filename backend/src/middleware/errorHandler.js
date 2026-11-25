import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

export function normalizeError(error) {
  if (error instanceof AppError) return error;
  if (error instanceof ZodError) {
    const fieldErrors = {};
    for (const issue of error.issues) fieldErrors[issue.path.join('.') || 'request'] ||= issue.code === 'unrecognized_keys' ? 'Remove unsupported fields.' : issue.message;
    return new AppError(400, 'VALIDATION_ERROR', 'Please check the highlighted fields.', fieldErrors);
  }
  if (error.type === 'entity.parse.failed') return new AppError(400, 'INVALID_JSON', 'Send a valid JSON request body.');
  if (error.type === 'entity.too.large') return new AppError(413, 'PAYLOAD_TOO_LARGE', 'This request is too large.');
  if (error.code === '23505' && error.constraint === 'doctors_email_unique') return new AppError(409, 'DOCTOR_EMAIL_EXISTS', 'A doctor with this email already exists.', { email: 'This email is already in use.' });
  if (error.code === '23P01') return new AppError(409, 'APPOINTMENT_CONFLICT', 'This doctor already has an appointment during that time.');
  if (error.code === '23503') return new AppError(409, 'RELATED_RECORD_CONFLICT', 'This record is still referenced by another record. Refresh and try again.');
  if (error.code === '23514' || error.code === '22007' || error.code === '22008') return new AppError(400, 'VALIDATION_ERROR', 'The record does not meet the clinic’s validation rules.');
  if (['40001', '40P01', '55P03'].includes(error.code)) return new AppError(409, 'CONCURRENT_CHANGE', 'This record changed during your request. Refresh and try again.');
  if (['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', '28P01', '3D000', '53300', '57P01', '57P02', '57P03', '08001', '08006', '57014'].includes(error.code)) return new AppError(503, 'DATABASE_UNAVAILABLE', 'The clinic service is temporarily unavailable. Please try again shortly.');
  return new AppError(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
}
export function errorHandler(logger = console) {
  return (error, request, response, _next) => {
    if (response.headersSent) return _next(error);
    const safe = normalizeError(error);
    if (safe.status >= 500) logger.error(JSON.stringify({ event: 'request_failed', code: safe.code, requestId: request.id }));
    response.status(safe.status).json({ error: { code: safe.code, message: safe.message, ...(safe.fieldErrors && { fieldErrors: safe.fieldErrors }) } });
  };
}
