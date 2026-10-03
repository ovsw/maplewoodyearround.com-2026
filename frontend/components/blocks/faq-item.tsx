import { createCustomLinkMarkRenderer } from "@/components/portable-text/custom-link-mark";
import { simpleRichTextComponents } from "@/components/simple-rich-text";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { PortableTextComponents } from "@portabletext/react";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

/*
 * One question in an FAQ accordion: the display-face question, a round plus
 * that turns into a cross when open, and the answer underneath. Shared by
 * the curated FAQ Section and the FAQ hub so the two read as one component.
 * Text and link colours follow the field's job tokens; `cream` only picks
 * the hairline and ring alphas, which differ between the light and dark
 * fields.
 */

export function faqAnswerComponents(): PortableTextComponents {
  return {
    ...simpleRichTextComponents,
    marks: {
      ...simpleRichTextComponents?.marks,
      customLink: createCustomLinkMarkRenderer(
        "font-medium text-prose-link underline decoration-prose-link/30 underline-offset-4 hover:text-prose-link-hover hover:decoration-prose-link-hover",
      ),
    },
  };
}

export function faqRuleClass(cream: boolean) {
  return cream ? "border-foreground/14" : "border-foreground/16";
}

export function FaqAccordionItem({
  children,
  compact = false,
  cream,
  question,
  value,
}: Readonly<{
  /** The rendered answer, or nothing for a question with no answer yet. */
  children?: ReactNode;
  /** Smaller question and tighter rows, for the hub's long lists. */
  compact?: boolean;
  cream: boolean;
  question: ReactNode;
  value: string;
}>) {
  return (
    <AccordionItem className={cn("border-b", faqRuleClass(cream))} value={value}>
      <AccordionTrigger
        className={cn(
          "group items-center gap-6 font-display hover:no-underline [&>svg]:hidden",
          compact ? "py-4 text-[19px] sm:py-5" : "py-6 text-title sm:py-7 sm:text-[24px]",
        )}
      >
        <span className="text-balance">{question}</span>
        <span
          aria-hidden="true"
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,color,transform] motion-base group-hover:border-mark group-data-[state=open]:rotate-45 group-data-[state=open]:border-mark group-data-[state=open]:bg-primary group-data-[state=open]:text-primary-foreground motion-reduce:transition-none",
            compact ? "size-9" : "size-10",
            cream ? "border-foreground/18" : "border-foreground/25",
          )}
        >
          <Plus className="size-4" strokeWidth={2} />
        </span>
      </AccordionTrigger>
      {children ? (
        <AccordionContent
          className={cn(compact ? "pb-6 text-base" : "pb-7 text-base", "text-muted-foreground")}
        >
          <div className="grid max-w-[38rem] gap-4 text-pretty leading-[1.6]">{children}</div>
        </AccordionContent>
      ) : null}
    </AccordionItem>
  );
}
