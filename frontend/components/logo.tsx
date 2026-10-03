import { siteName } from "@/lib/site-name";
import type { SETTINGS_QUERY_RESULT } from "@/sanity.types";

export default function Logo({ settings }: { settings: SETTINGS_QUERY_RESULT }) {
  return <span className="text-lg font-semibold">{settings?.siteName?.trim() || siteName}</span>;
}
