import { BadGatewayException } from '@nestjs/common';

export const AI_OUTPUT_INVALID_ERROR_CODE = 'AI_OUTPUT_INVALID';

export class AiOutputValidationException extends BadGatewayException {
  constructor(
    target: 'outlines' | 'quality' | 'caption' | 'imagePrompt' = 'outlines',
    friendlyMessage?: string,
  ) {
    super({
      code: AI_OUTPUT_INVALID_ERROR_CODE,
      message:
        friendlyMessage ||
        `AI returned invalid ${target} output. Please retry.`,
      retryable: true,
    });
  }
}
