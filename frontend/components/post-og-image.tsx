import { fitPostOgTitle } from "@/lib/post-og-image";

// Colours from DESIGN.md. The photo overlay repeats the inner hero overlay, so
// the card matches the share images of the live site.
const CAMP_GREEN = "#006601";
const PHOTO_OVERLAY =
  "linear-gradient(90deg, #006601 11%, rgba(0, 102, 1, 0.8) 45%, rgba(0, 102, 1, 0.4))";

export function PostOgImage({
  eyebrow,
  photoUrl,
  title,
}: {
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
          width: 560,
          color: "#ffffff",
        }}
      >
        {eyebrow ? (
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
