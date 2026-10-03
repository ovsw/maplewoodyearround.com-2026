import { Card, Stack, Text } from "@sanity/ui";
import { type StringInputProps, useFormValue } from "sanity";
import {
  getSeoTitleWarnings,
  resolveSeoTitle,
} from "../../../shared/seo-title";
import { studioSiteName } from "../../site-name";

export function SeoTitleInput(props: StringInputProps) {
  const documentTitle = useFormValue(["title"]);
  const fallbackTitle =
    typeof documentTitle === "string" ? documentTitle : undefined;
  const overrideTitle =
    typeof props.value === "string" ? props.value : undefined;
  const { finalTitle } = resolveSeoTitle({
    fallbackTitle,
    overrideTitle,
    siteName: studioSiteName,
  });
  const fallback = resolveSeoTitle({ fallbackTitle, siteName: studioSiteName });
  const warnings = getSeoTitleWarnings({
    fallbackTitle,
    overrideTitle,
    siteName: studioSiteName,
  });

  return (
    <Stack space={3}>
      {props.renderDefault(props)}
      <Card
        border
        padding={3}
        radius={2}
        tone={warnings.length ? "caution" : "default"}
      >
        <Stack space={2}>
          <Text size={1} weight="semibold">
            Content title fallback
          </Text>
          <Text size={1}>{fallback.pageTitle}</Text>
          <Text size={1} weight="semibold">
            Final search title
          </Text>
          <Text size={1}>{finalTitle}</Text>
          <Text muted size={1}>
            {overrideTitle?.includes("|")
              ? "Using the complete title exactly as written. The automatic suffix is disabled."
              : overrideTitle?.trim()
                ? `Using the override above. “| ${studioSiteName}” is added automatically.`
                : `Using the content title. “| ${studioSiteName}” is added automatically.`}
          </Text>
          {warnings.map((warning) => (
            <Text key={warning} size={1}>
              {warning}
            </Text>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}
