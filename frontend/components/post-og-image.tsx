import { fitPostOgTitle } from "@/lib/post-og-image";

// Colours from DESIGN.md. The photo overlay repeats the inner hero overlay, so
// the card matches the share images of the live site.
const CAMP_GREEN = "#006601";
const PHOTO_OVERLAY =
  "linear-gradient(90deg, #006601 11%, rgba(0, 102, 1, 0.8) 45%, rgba(0, 102, 1, 0.4))";
// The season pills of the live breadcrumbs: Marigold with Pine Ink, Deep Violet with Cream.
const SEASON_PILLS: Record<string, { background: string; color: string }> = {
  summerCamp: { background: "#ffb000", color: "#243021" },
  schoolYear: { background: "#ae4dd5", color: "#fffbf0" },
};

export type CardBreadcrumb = { label: string; program: string | null };

function Chevron() {
  return (
    <svg
      fill="none"
      height={18}
      stroke="#ffffff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={18}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function Breadcrumbs({ breadcrumbs }: { breadcrumbs: CardBreadcrumb[] }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 18,
        fontFamily: "Lato",
        fontSize: 24,
        lineHeight: 1,
      }}
    >
      {breadcrumbs.map((crumb, index) => {
        const pill = crumb.program ? SEASON_PILLS[crumb.program] : undefined;
        return (
          <div key={index} style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: 40,
                color: pill?.color ?? "#ffffff",
                // The card renderer fails on an undefined colour, so plain
                // steps set no pill styles at all.
                ...(pill
                  ? { padding: "0 6px", borderRadius: 8, backgroundColor: pill.background }
                  : {}),
              }}
            >
              {crumb.label}
            </div>
            <div style={{ display: "flex", margin: "0 5px" }}>
              <Chevron />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PostOgImage({
  breadcrumbs,
  eyebrow,
  photoUrl,
  title,
}: {
  breadcrumbs?: CardBreadcrumb[];
  eyebrow?: string;
  photoUrl?: string | null;
  title: string;
}) {
  const fittedTitle = fitPostOgTitle(title);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: CAMP_GREEN,
      }}
    >
      {photoUrl ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            display: "flex",
            width: 600,
            height: 630,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse requires a plain image element. */}
          <img
            alt=""
            height={630}
            src={photoUrl}
            style={{ objectFit: "cover" }}
            width={600}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              display: "flex",
              width: 600,
              height: 630,
              backgroundImage: PHOTO_OVERLAY,
            }}
          />
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 60,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          // The live hero text column: 60% of the content width.
          width: 648,
          color: "#ffffff",
        }}
      >
        {breadcrumbs?.length ? (
          <Breadcrumbs breadcrumbs={breadcrumbs} />
        ) : eyebrow ? (
          <div
            style={{
              display: "flex",
              marginBottom: 28,
              fontFamily: "Lato",
              fontSize: 27,
              lineHeight: 1.2,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            fontFamily: "Poppins",
            fontSize: fittedTitle.fontSize,
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {fittedTitle.text}
        </div>
      </div>
    </div>
  );
}
