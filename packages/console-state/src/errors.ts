// Should have error codes from
// https://github.com/RelationalAI/console-services/blob/main/pkg/errors/errors.go#L21

export enum SvcErrorCode {
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
}

export class SvcError extends Error {
  constructor(
    public message: string,
    public errorCode?: SvcErrorCode,
    public status?: number,
  ) {
    super();
  }
}
