export class AppError extends Error {
  constructor(status, code, message, fieldErrors) { super(message); this.name = 'AppError'; this.status = status; this.code = code; this.fieldErrors = fieldErrors; }
}
export class OwnershipChanged extends Error {}
export const notFound = (resource) => new AppError(404, `${resource.toUpperCase()}_NOT_FOUND`, `This ${resource} could not be found.`);
