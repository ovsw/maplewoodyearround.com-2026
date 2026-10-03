import Custom404 from "@/components/404";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
};

export default async function NotFoundPage() {
  return <Custom404 />;
}
