import { BadRequestException } from '@nestjs/common';

export const QUOTA_EXCEEDED_ERROR_CODE = 'QUOTA_EXCEEDED';

export class QuotaExceededException extends BadRequestException {
  constructor(quotaLimit?: number) {
    super({
      code: QUOTA_EXCEEDED_ERROR_CODE,
      message: 'Monthly quota exceeded. Please upgrade your plan.',
      quotaLimit,
    });
  }
}
