import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

export const SESSION_MODEL_CONFIG_MISSING_CODE = 'SESSION_MODEL_CONFIG_MISSING';
export const AI_UPSTREAM_TIMEOUT_CODE = 'AI_UPSTREAM_TIMEOUT';
export const AI_UPSTREAM_EMPTY_RESPONSE_CODE = 'AI_UPSTREAM_EMPTY_RESPONSE';
export const AI_UPSTREAM_QUOTA_EXCEEDED_CODE = 'AI_UPSTREAM_QUOTA_EXCEEDED';
export const AI_PROVIDER_KEY_MISSING_CODE = 'AI_PROVIDER_KEY_MISSING';
export const AI_UPSTREAM_ERROR_CODE = 'AI_UPSTREAM_ERROR';

export function sessionModelConfigMissingException(
  target: 'outline' | 'content',
): BadRequestException {
  const label = target === 'outline' ? '大纲生成' : '图文生成';

  return new BadRequestException({
    code: SESSION_MODEL_CONFIG_MISSING_CODE,
    message: `${label}所需的模型配置未找到，请先到设置页保存模型配置后重试。`,
    retryable: false,
  });
}

export function mapGenerateErrorToHttpException(
  error: unknown,
  target: 'outline' | 'content',
): HttpException {
  if (error instanceof HttpException) {
    return error;
  }

  const rawMessage =
    error instanceof Error ? error.message : 'Unknown AI upstream error';
  const normalized = rawMessage.toLowerCase();
  const targetLabel = target === 'outline' ? '大纲' : '图文';

  if (normalized.includes('api key is not configured')) {
    return new BadRequestException({
      code: AI_PROVIDER_KEY_MISSING_CODE,
      message: `当前${targetLabel}模型缺少可用 API Key，请在设置页补充后重试。`,
      retryable: false,
    });
  }

  if (isTimeoutError(normalized, error)) {
    return new GatewayTimeoutException({
      code: AI_UPSTREAM_TIMEOUT_CODE,
      message: `AI 服务响应超时，${targetLabel}生成已中断，请稍后重试。`,
      retryable: true,
    });
  }

  if (isUpstreamQuotaError(normalized)) {
    return new HttpException(
      {
        code: AI_UPSTREAM_QUOTA_EXCEEDED_CODE,
        message: `上游 AI 服务配额不足或触发限流，暂时无法生成${targetLabel}，请稍后重试或更换模型。`,
        retryable: true,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  if (isEmptyOrIncompleteResponseError(normalized)) {
    return new BadGatewayException({
      code: AI_UPSTREAM_EMPTY_RESPONSE_CODE,
      message: `AI 服务返回了空结果或不完整内容，无法完成${targetLabel}生成，请重试。`,
      retryable: true,
    });
  }

  return new BadGatewayException({
    code: AI_UPSTREAM_ERROR_CODE,
    message: `AI 服务暂时不可用，${targetLabel}生成失败，请稍后重试。`,
    retryable: true,
  });
}

function isTimeoutError(normalizedMessage: string, error: unknown): boolean {
  if (error instanceof Error && error.name.toLowerCase().includes('timeout')) {
    return true;
  }

  return (
    normalizedMessage.includes('timeout') ||
    normalizedMessage.includes('timed out') ||
    normalizedMessage.includes('aborterror') ||
    normalizedMessage.includes('etimedout') ||
    normalizedMessage.includes('gateway timeout')
  );
}

function isUpstreamQuotaError(normalizedMessage: string): boolean {
  return (
    normalizedMessage.includes('insufficient_quota') ||
    normalizedMessage.includes('quota') ||
    normalizedMessage.includes('rate limit') ||
    normalizedMessage.includes('too many requests') ||
    normalizedMessage.includes('429')
  );
}

function isEmptyOrIncompleteResponseError(normalizedMessage: string): boolean {
  return (
    normalizedMessage.includes('empty response') ||
    normalizedMessage.includes('no response') ||
    normalizedMessage.includes('no json array found') ||
    normalizedMessage.includes('unexpected end of json input') ||
    normalizedMessage.includes('incomplete json') ||
    normalizedMessage.includes('no image data') ||
    normalizedMessage.includes('no image url') ||
    normalizedMessage.includes('invalid json')
  );
}
