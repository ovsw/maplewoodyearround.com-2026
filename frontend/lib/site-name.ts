export const siteName = assertValue(
  process.env.NEXT_PUBLIC_SITE_NAME,
  "Missing environment variable: NEXT_PUBLIC_SITE_NAME",
);

function assertValue<T>(value: T | undefined, errorMessage: string): T {
  if (value === undefined) throw new Error(errorMessage);
  return value;
}
