import { fitPostOgTitle } from "@/lib/post-og-image";

export function PostOgImage({
  eyebrow,
  siteName,
  title,
}: {
  eyebrow: string;
  siteName: string;
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
        backgroundColor: "#202020",
        backgroundImage:
          "linear-gradient(90deg, #202020 0%, #202020 52%, rgba(32, 32, 32, 0.78) 68%, rgba(32, 32, 32, 0.08) 100%), radial-gradient(58% 94% at 88% 42%, rgba(80, 80, 80, 0.64), transparent 70%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          display: "flex",
          width: "43%",
          height: "100%",
          backgroundImage:
            "linear-gradient(180deg, rgba(255, 255, 255, 0.07), transparent 33%)",
          clipPath: "polygon(18% 0, 100% 0, 100% 100%, 0 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "9.5%",
          left: "7%",
          display: "flex",
          color: "#e0e0e0",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: 17,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        {eyebrow}
      </div>

      <div
        style={{
          position: "absolute",
          top: "29%",
          left: "7%",
          display: "flex",
          width: "58%",
          height: 179,
          overflow: "hidden",
          color: "#ffffff",
          fontFamily: "sans-serif",
          fontSize: fittedTitle.fontSize,
          fontWeight: 600,
          lineHeight: 1.1,
          letterSpacing: "-0.025em",
        }}
      >
        {fittedTitle.text}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "9.5%",
          left: "7%",
          display: "flex",
          color: "#ffffff",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: 16,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: "0.14em",
        }}
      >
        {siteName}
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      />
    </div>
  );
}
