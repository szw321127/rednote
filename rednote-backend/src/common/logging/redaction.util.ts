const SECRET_PATTERNS: RegExp[] = [
  /(Bearer\s+)[A-Za-z0-9._-]+/gi,
  /([?&]key=)[^&\s]+/gi,
  /(api[_-]?key["'\s:=]+)[A-Za-z0-9._-]+/gi,
  /(authorization["'\s:=]+)[A-Za-z0-9._-]+/gi,
];

export function redactSecrets(input: string): string {
  let value = input;

  for (const pattern of SECRET_PATTERNS) {
    value = value.replace(pattern, '$1***');
  }

  return value;
}

export function summarizeText(value: string, maxLength: number = 120): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}...`;
}
