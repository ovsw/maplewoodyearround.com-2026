import { Search } from "lucide-react";
import {
  DynamicIcon,
  dynamicIconImports,
  type IconName,
} from "lucide-react/dynamic.mjs";
import { createElement, useId, useMemo, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Grid,
  Stack,
  Text,
  TextInput,
  useToast,
} from "@sanity/ui";
import { set, type ObjectInputProps } from "sanity";
import {
  canonicalLucideIconNames,
  isCanonicalLucideIconName,
} from "./lucide-icon-catalog";

const PAGE_SIZE = 60;

function IconGlyph({ name, size = 20 }: { name: string; size?: number }) {
  if (!isCanonicalLucideIconName(name)) return null;

  return (
    <DynamicIcon
      aria-hidden="true"
      name={name as IconName}
      size={size}
      strokeWidth={1.75}
    />
  );
}

export function createNavigationIconPreview(name: string) {
  return function NavigationIconPreview() {
    return <IconGlyph name={name} />;
  };
}

function PickerOption({
  label,
  name,
  onSelect,
  selected,
}: {
  label: string;
  name: string;
  onSelect: (name: string) => void;
  selected: boolean;
}) {
  return (
    <Card
      aria-label={`Choose ${label}`}
      aria-pressed={selected}
      as="button"
      onClick={() => onSelect(name)}
      padding={3}
      pressed={selected}
      radius={2}
      style={{ cursor: "pointer", minHeight: 82 }}
      tone={selected ? "primary" : "default"}
      type="button"
    >
      <Stack space={3}>
        <Flex justify="center">
          <IconGlyph name={name} size={24} />
        </Flex>
        <Text align="center" size={1} textOverflow="ellipsis">
          {label}
        </Text>
      </Stack>
    </Card>
  );
}

export type NavigationIconValue = {
  name?: string;
  svg?: string;
};

/**
 * Render a canonical Lucide icon to standalone SVG markup. Stored in the
 * document at pick time so the frontend can inline the artwork without
 * bundling the Lucide icon set (which made the Next dev server compile
 * ~2,000 icon modules per graph).
 */
async function renderLucideIconSvg(name: string): Promise<string | undefined> {
  const loadIcon = dynamicIconImports[name as IconName];
  if (!loadIcon) return undefined;

  try {
    const iconModule = await loadIcon();
    return renderToStaticMarkup(
      createElement(iconModule.default, { "aria-hidden": true }),
    );
  } catch (error) {
    console.error(`Could not render SVG markup for Lucide icon "${name}"`, error);
    return undefined;
  }
}

export default function NavigationIconInput(props: ObjectInputProps) {
  const dialogId = useId();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const value = props.value as NavigationIconValue | undefined;
  const selectedName = value?.name;

  const normalizedQuery = query.trim().toLowerCase().replaceAll(" ", "-");
  const filteredLucideNames = useMemo(() => {
    if (!normalizedQuery) return canonicalLucideIconNames;
    return canonicalLucideIconNames.filter((name) => name.includes(normalizedQuery));
  }, [normalizedQuery]);
  const visibleLucideNames = filteredLucideNames.slice(0, limit);
  const matchingCount = filteredLucideNames.length;

  const close = () => setOpen(false);
  const openPicker = () => {
    setQuery("");
    setLimit(PAGE_SIZE);
    setOpen(true);
  };
  const selectIcon = async (name: string) => {
    const svg = await renderLucideIconSvg(name);
    if (!svg) {
      // Saving a Lucide icon without its artwork would fail validation and
      // render nothing on the site, so keep the picker open instead.
      toast.push({
        status: "error",
        title: `Could not load the "${name}" icon`,
        description: "Check your connection and pick the icon again.",
      });
      return;
    }

    props.onChange(set({ name, svg }));
    close();
  };

  return (
    <>
      <Button
        disabled={props.readOnly}
        icon={selectedName ? <IconGlyph name={selectedName} /> : undefined}
        id={props.elementProps.id}
        mode="ghost"
        onBlur={props.elementProps.onBlur}
        onClick={openPicker}
        onFocus={props.elementProps.onFocus}
        text={selectedName || "Choose an icon"}
        type="button"
        width="fill"
      />

      {open ? (
        <Dialog
          header="Choose a navigation icon"
          id={dialogId}
          onClose={close}
          width={4}
        >
          <Box padding={4}>
            <Stack space={4}>
              <TextInput
                autoFocus
                icon={Search}
                onChange={(event) => {
                  setQuery(event.currentTarget.value);
                  setLimit(PAGE_SIZE);
                }}
                placeholder="Search icons by name"
                value={query}
              />

              <Text muted size={1}>
                {matchingCount} matching icon{matchingCount === 1 ? "" : "s"}
              </Text>

              {visibleLucideNames.length ? (
                <Stack space={3}>
                  <Text size={1} weight="semibold">
                    Lucide icons
                  </Text>
                  <Grid columns={[2, 3, 4, 5]} gap={2}>
                    {visibleLucideNames.map((name) => (
                      <PickerOption
                        key={name}
                        label={name}
                        name={name}
                        onSelect={selectIcon}
                        selected={name === selectedName}
                      />
                    ))}
                  </Grid>
                </Stack>
              ) : null}

              {!matchingCount ? (
                <Card padding={4} radius={2} tone="transparent">
                  <Text align="center" muted size={1}>
                    No icons match “{query}”.
                  </Text>
                </Card>
              ) : null}

              {visibleLucideNames.length < filteredLucideNames.length ? (
                <Button
                  mode="ghost"
                  onClick={() => setLimit((current) => current + PAGE_SIZE)}
                  text={`Show ${Math.min(PAGE_SIZE, filteredLucideNames.length - visibleLucideNames.length)} more`}
                  type="button"
                  width="fill"
                />
              ) : null}
            </Stack>
          </Box>
        </Dialog>
      ) : null}
    </>
  );
}
