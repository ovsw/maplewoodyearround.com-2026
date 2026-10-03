export function requireStudioEnvironmentValue(
  name: string,
  value: string | undefined,
) {
  const result = value?.trim();

  if (!result) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return result;
}
