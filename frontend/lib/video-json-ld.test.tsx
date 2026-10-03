import VideoJsonLd from "@/components/video-json-ld";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createVideoObjectJsonLd,
  serializeVideoObjectJsonLd,
} from "./video-json-ld";

describe("VideoJsonLd", () => {
  it("builds VideoObject data from video-like Portable Text blocks", () => {
    expect(
      createVideoObjectJsonLd([
        {
          _type: "videoEmbed",
          title: " Product walkthrough ",
          description: " How it works. ",
          embedUrl: " https://video.example.com/embed/1 ",
          thumbnailUrl: " https://cdn.example.com/thumb.jpg ",
          uploadDate: "2026-08-01T00:00:00.000Z",
        },
      ]),
    ).toEqual([
      {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: "Product walkthrough",
        description: "How it works.",
        embedUrl: "https://video.example.com/embed/1",
        thumbnailUrl: "https://cdn.example.com/thumb.jpg",
        uploadDate: "2026-08-01T00:00:00.000Z",
      },
    ]);
  });

  it("ignores incomplete video-like blocks", () => {
    expect(
      createVideoObjectJsonLd([
        { _type: "customLink", title: "Article", url: "https://example.com" },
        { _type: "videoEmbed", title: "Missing URL" },
      ]),
    ).toEqual([]);
  });

  it("escapes unsafe text and renders scripts", () => {
    const [value] = createVideoObjectJsonLd([
      {
        _type: "videoEmbed",
        title: "Demo <fast>",
        url: "https://video.example.com/embed/1",
      },
    ]);

    expect(serializeVideoObjectJsonLd(value)).not.toContain("<");

    const { container } = render(
      <VideoJsonLd
        content={[
          {
            _type: "videoEmbed",
            title: "Demo <fast>",
            url: "https://video.example.com/embed/1",
          },
        ]}
      />,
    );

    expect(container.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
  });
});
