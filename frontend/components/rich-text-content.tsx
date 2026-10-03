import {
  PortableText,
  type PortableTextBlockComponent,
  type PortableTextProps,
} from "@portabletext/react";
import { buttonVariants } from "@/components/ui/button";
import { CustomLinkMarkRenderer } from "@/components/portable-text/custom-link-mark";
import { getSafeLinkHref } from "@/lib/safe-href";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";

type GetHeadingId = (block: { _key?: string }) => string | undefined;
type RichTextBlockComponents = Extract<
  NonNullable<PortableTextProps["components"]>["block"],
  Record<string, unknown>
>;

function getButtonVariant(value: unknown) {
  const variant = stegaClean(value);
  return variant === "secondary" || variant === "outline" || variant === "link"
    ? variant
    : "default";
}

type HeadingTag = "h2" | "h3" | "h4" | "h5" | "h6";

function createHeadingComponent(
  Tag: HeadingTag,
  className: string,
  getHeadingId?: GetHeadingId,
): PortableTextBlockComponent {
  return function RichTextHeading({ children, value }) {
    return (
      <Tag
        className={cn(className, getHeadingId && "scroll-mt-28")}
        id={getHeadingId?.(value)}
      >
        {children}
      </Tag>
    );
  };
}

function createRichTextHeadingComponents(getHeadingId?: GetHeadingId) {
  return {
    h2: createHeadingComponent("h2", "mb-4 mt-12 first:mt-0", getHeadingId),
    h3: createHeadingComponent("h3", "mb-4 mt-10 first:mt-0", getHeadingId),
    h4: createHeadingComponent("h4", "mb-4 mt-8 first:mt-0", getHeadingId),
    h5: createHeadingComponent("h5", "mb-4 mt-8 first:mt-0", getHeadingId),
    h6: createHeadingComponent(
      "h6",
      "mb-4 mt-8 text-base font-semibold first:mt-0",
      getHeadingId,
    ),
  };
}

const richTextBlockComponents = {
  normal: ({ children }) => <p className="mb-4">{children}</p>,
  ...createRichTextHeadingComponents(),
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-2 border-border pl-4 italic">
      {children}
    </blockquote>
  ),
  inline: ({ children }) => <span>{children}</span>,
} satisfies RichTextBlockComponents;

export const richTextContentComponents: PortableTextProps["components"] = {
  block: richTextBlockComponents,
  list: {
    bullet: ({ children }) => (
      <ul className="mb-4 list-outside list-disc space-y-2 pl-6">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mb-4 list-outside list-decimal space-y-2 pl-6">{children}</ol>
    ),
  },
  marks: {
    customLink: CustomLinkMarkRenderer,
    buttonLink: ({ children, value }) => {
      const href = getSafeLinkHref(value?.href);
      return href ? (
        <Link
          className={cn(
            buttonVariants({ variant: getButtonVariant(value.variant) }),
            "my-2 no-underline",
          )}
          href={href}
          rel={value.openInNewTab ? "noopener noreferrer" : undefined}
          target={value.openInNewTab ? "_blank" : undefined}
        >
          {children}
        </Link>
      ) : (
        <span>{children}</span>
      );
    },
  },
  types: {
    image: ({ value }) => {
      const asset = value.resolvedAsset;
      if (!asset?.url) return null;

      return (
        <figure className="my-4">
          <Image
            alt={value.alt || ""}
            blurDataURL={asset.metadata?.lqip || undefined}
            className="h-auto w-full rounded-card"
            height={asset.metadata?.dimensions?.height ?? 900}
            placeholder={asset.metadata?.lqip ? "blur" : undefined}
            quality={100}
            sizes="(min-width: 1024px) 896px, calc(100vw - 2rem)"
            src={urlFor(asset._id).width(1600).fit("max").url()}
            width={asset.metadata?.dimensions?.width ?? 1600}
          />
          {value.caption ? (
            <figcaption className="mt-2 text-center text-sm text-muted-foreground">
              {value.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    },
    table: ({ value }) => {
      const rows = Array.isArray(value.rows)
        ? value.rows.filter(
            (row: { cells?: unknown[] }) =>
              Array.isArray(row.cells) && row.cells.length > 0,
          )
        : [];
      const [headerRow, ...bodyRows] = rows;
      if (!headerRow) return null;

      return (
        <div className="my-8 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            {value.title ? <caption className="sr-only">{value.title}</caption> : null}
            <thead>
              <tr>
                {headerRow.cells.map((cell: string, index: number) => (
                  <th
                    className="border border-border bg-muted px-4 py-3 font-semibold text-foreground"
                    key={`${headerRow._key ?? "header"}-${index}`}
                    scope="col"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map(
                (row: { _key?: string; cells: string[] }, rowIndex: number) => (
                  <tr key={row._key ?? `row-${rowIndex}`}>
                    {row.cells.map((cell, cellIndex) => (
                      <td
                        className="border border-border px-4 py-3 align-top"
                        key={`${row._key ?? rowIndex}-${cellIndex}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      );
    },
    callout: ({ value }) => {
      const title = stegaClean(value.title)?.trim();
      const body = stegaClean(value.body)?.trim();
      if (!(title || body)) return null;

      return (
        <aside className="my-8 border-l-4 border-border pl-5">
          {title ? <p className="mb-2 font-semibold text-foreground">{title}</p> : null}
          {body ? <p className="my-0 text-muted-foreground">{body}</p> : null}
        </aside>
      );
    },
  },
};

function createPostRichTextComponents(
  getHeadingId: GetHeadingId,
): PortableTextProps["components"] {
  return {
    ...richTextContentComponents,
    block: {
      ...richTextBlockComponents,
      ...createRichTextHeadingComponents(getHeadingId),
    },
  };
}

export default function RichTextContent({
  className,
  dataSanity,
  getHeadingId,
  value,
}: Readonly<{
  className?: string;
  dataSanity?: string;
  getHeadingId?: GetHeadingId;
  value: PortableTextProps["value"];
}>) {
  return (
    <div
      className={cn(
        "max-w-none text-base leading-7 text-soft-foreground [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_a]:font-medium [&_blockquote]:blockquote-accent [&_blockquote]:px-5 [&_blockquote]:py-3 [&_blockquote]:text-foreground [&_figcaption]:text-muted-foreground [&_h2]:mt-12 [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-3 [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:tracking-normal [&_h3]:mt-10 [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:tracking-normal [&_h4]:mt-8 [&_h4]:text-xl [&_h4]:font-semibold [&_li]:my-2 [&_ol]:my-6 [&_ol]:pl-6 [&_p]:my-5 [&_p]:text-pretty [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:my-6 [&_ul]:pl-6",
        className,
      )}
      data-sanity={dataSanity}
    >
      <PortableText
        components={
          getHeadingId
            ? createPostRichTextComponents(getHeadingId)
            : richTextContentComponents
        }
        value={value}
      />
    </div>
  );
}
