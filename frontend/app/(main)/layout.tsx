import { CachedHeader, DynamicHeader } from "@/components/header";
import { CachedFooter, DynamicFooter } from "@/components/footer";
import { DisableDraftMode } from "@/components/disable-draft-mode";
import { VisualEditing } from "next-sanity/visual-editing";
import { draftMode } from "next/headers";
import { SanityLive } from "@/sanity/lib/live";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isEnabled: isDraftMode } = await draftMode();

  return (
    <>
      <a
        className="fixed top-4 left-4 z-80 -translate-y-[calc(100%+2rem)] rounded-control bg-fill-night px-4 py-3 font-semibold text-fill-night-foreground transition-transform focus:translate-y-0 focus:outline-2 focus:outline-offset-2 focus:outline-ring motion-reduce:transition-none"
        href="#main-content"
      >
        Skip to content
      </a>
      {isDraftMode ? (
        <DynamicHeader />
      ) : (
        <CachedHeader perspective="published" stega={false} />
      )}
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <SanityLive includeDrafts={isDraftMode} />
      {isDraftMode && (
        <>
          <DisableDraftMode />
          <VisualEditing />
        </>
      )}
      {isDraftMode ? (
        <DynamicFooter />
      ) : (
        <CachedFooter perspective="published" stega={false} />
      )}
    </>
  );
}
