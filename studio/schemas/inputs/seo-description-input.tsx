import { Card, Stack, Text } from "@sanity/ui";
import { useEffect, useMemo, useState } from "react";
import { type TextInputProps, useClient, useFormValue } from "sanity";
import {
  portableTextToPlainText,
  resolveSeoDescription,
  type SeoDescriptionSource,
} from "../../../shared/seo-description";

const SITE_DESCRIPTION_QUERY = `*[_id == "settings"][0].seoDescription`;

const sourceLabels: Record<SeoDescriptionSource, string> = {
  seo: "the SEO description override above",
  content: "the content description",
  site: "the site-wide description in Global Settings",
};

export function SeoDescriptionInput(props: TextInputProps) {
  const documentType = useFormValue(["_type"]);
  const description = useFormValue(["description"]);
  const excerpt = useFormValue(["excerpt"]);
  // Drafts perspective: the explanation follows the editing state, the same
  // way the document fields above do. The Website reads published content.
  const baseClient = useClient({ apiVersion: "2026-03-23" });
  const client = useMemo(
    () => baseClient.withConfig({ perspective: "drafts" }),
    [baseClient],
  );
  const [siteDescription, setSiteDescription] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    client
      .fetch<string | null>(SITE_DESCRIPTION_QUERY)
      .then((value) => {
        if (active) setSiteDescription(value);
      })
      .catch(() => {
        if (active) setSiteDescription(null);
      });
    return () => {
      active = false;
    };
  }, [client]);

  const contentDescription =
    documentType === "post"
      ? portableTextToPlainText(excerpt)
      : typeof description === "string"
        ? description
        : undefined;
  const effective = resolveSeoDescription({
    contentDescription,
    seoDescription: typeof props.value === "string" ? props.value : undefined,
    siteDescription,
  });
  const isGeneric = effective.source === "site" || !effective.source;

  return (
    <Stack space={3}>
      {props.renderDefault(props)}
      <Card border padding={3} radius={2} tone={isGeneric ? "caution" : "default"}>
        <Stack space={2}>
          <Text size={1} weight="semibold">
            Effective description
          </Text>
          <Text size={1}>
            {effective.description || "There is no effective description."}
          </Text>
          {effective.source ? (
            <Text muted size={1}>
              Using {sourceLabels[effective.source]}.
            </Text>
          ) : null}
          {effective.source === "site" ? (
            <Text size={1}>
              Only the generic site-wide description is available. Add an SEO
              description or a content description to describe this page.
            </Text>
          ) : null}
          {!effective.source ? (
            <Text size={1}>
              Add an SEO description, a content description, or a site-wide
              description in Global Settings.
            </Text>
          ) : null}
        </Stack>
      </Card>
    </Stack>
  );
}
