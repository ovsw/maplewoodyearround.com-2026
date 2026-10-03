import { PortableText, type PortableTextProps } from "@portabletext/react";
import Image from "next/image";
import { CustomLinkMarkRenderer } from "@/components/portable-text/custom-link-mark";

const portableTextComponents: PortableTextProps["components"] = {
  types: {
    image: ({ value }) => {
      const asset = value.asset;
      if (!asset?.url || !asset.metadata?.dimensions) return null;

      const { lqip, dimensions } = asset.metadata;
      return (
        <Image
          alt={value.alt || "Image"}
          blurDataURL={lqip || undefined}
          height={dimensions.height}
          placeholder={lqip ? "blur" : undefined}
          quality={100}
          src={asset.url}
          style={{
            borderRadius: "1rem",
            marginLeft: "auto",
            marginRight: "auto",
          }}
          width={dimensions.width}
        />
      );
    },
  },
  block: {
    normal: ({ children }) => <p style={{ marginBottom: "1rem" }}>{children}</p>,
    h1: ({ children }) => (
      <h1 style={{ marginBottom: "1rem", marginTop: "1rem" }}>{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 style={{ marginBottom: "1rem", marginTop: "1rem" }}>{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 style={{ marginBottom: "1rem", marginTop: "1rem" }}>{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 style={{ marginBottom: "1rem", marginTop: "1rem" }}>{children}</h4>
    ),
    h5: ({ children }) => (
      <h5 style={{ marginBottom: "1rem", marginTop: "1rem" }}>{children}</h5>
    ),
  },
  marks: {
    customLink: CustomLinkMarkRenderer,
  },
  list: {
    bullet: ({ children }) => (
      <ul
        style={{
          marginBottom: "1rem",
          paddingLeft: "1.5rem",
          listStylePosition: "inside",
          listStyleType: "disc",
        }}
      >
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol
        style={{
          marginBottom: "1rem",
          paddingLeft: "1.5rem",
          listStylePosition: "inside",
          listStyleType: "decimal",
        }}
      >
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li style={{ marginBottom: "0.5rem" }}>{children}</li>
    ),
    number: ({ children }) => (
      <li style={{ marginBottom: "0.5rem" }}>{children}</li>
    ),
  },
};

export default function PortableTextRenderer({
  value,
}: {
  value: PortableTextProps["value"];
}) {
  return <PortableText components={portableTextComponents} value={value} />;
}
