export const siteUrl = assertValue(
  process.env.NEXT_PUBLIC_SITE_URL,
  "Missing environment variable: NEXT_PUBLIC_SITE_URL",
);

function assertValue<T>(value: T | undefined, errorMessage: string): T {
  if (value === undefined) {
    throw new Error(errorMessage);
  }

  return value;
}
