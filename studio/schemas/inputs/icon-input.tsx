import { SearchIcon } from "@sanity/icons/Search";
import { useEffect, useId, useMemo, useState } from "react";
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
import { iconNames, loadIconSvgs } from "./icon-catalog";

const PAGE_SIZE = 60;

/** Stored icon markup, drawn at a fixed size. */
function IconGlyph({ svg, size = 20 }: { svg: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ display: "inline-flex" }}
      dangerouslySetInnerHTML={{
        __html: svg.replace("<svg ", `<svg width="${size}" height="${size}" `),
      }}
    />
  );
}

export function createIconPreview(svg: string) {
  return function IconPreview() {
    return <IconGlyph svg={svg} />;
  };
}

function PickerOption({
  name,
  onSelect,
  selected,
  svg,
}: {
  name: string;
  onSelect: (name: string) => void;
  selected: boolean;
  svg: string;
}) {
  return (
    <Card
      aria-label={`Choose ${name}`}
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
          <IconGlyph svg={svg} size={24} />
        </Flex>
        <Text align="center" size={1} textOverflow="ellipsis">
          {name}
        </Text>
      </Stack>
    </Card>
  );
}

export type IconValue = {
  name?: string;
  svg?: string;
};

export default function IconInput(props: ObjectInputProps) {
  const dialogId = useId();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [svgs, setSvgs] = useState<Record<string, string>>();
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const value = props.value as IconValue | undefined;
  const selectedName = value?.name;

  useEffect(() => {
    if (!open || svgs) return;
    loadIconSvgs()
      .then(setSvgs)
      .catch(() => {
        toast.push({
          status: "error",
          title: "Could not load the icons",
          description: "Check your connection and open the picker again.",
        });
        setOpen(false);
      });
  }, [open, svgs, toast]);

  const normalizedQuery = query.trim().toLowerCase().replaceAll(" ", "-");
  const filteredNames = useMemo(() => {
    if (!normalizedQuery) return iconNames;
    return iconNames.filter((name) => name.includes(normalizedQuery));
  }, [normalizedQuery]);
  const visibleNames = filteredNames.slice(0, limit);
  const matchingCount = filteredNames.length;

  const close = () => setOpen(false);
  const openPicker = () => {
    setQuery("");
    setLimit(PAGE_SIZE);
    setOpen(true);
  };
  const selectIcon = (name: string) => {
    const svg = svgs?.[name];
    if (!svg) return;
    props.onChange(set({ name, svg }));
    close();
  };

  return (
    <>
      <Button
        disabled={props.readOnly}
        icon={value?.svg ? <IconGlyph svg={value.svg} /> : undefined}
        id={props.elementProps.id}
        mode="ghost"
        onBlur={props.elementProps.onBlur}
        onClick={openPicker}
        onFocus={props.elementProps.onFocus}
        text={selectedName || (value?.svg ? "Unnamed icon" : "Choose an icon")}
        type="button"
        width="fill"
      />

      {open ? (
        <Dialog header="Choose an icon" id={dialogId} onClose={close} width={4}>
          <Box padding={4}>
            {svgs ? (
              <Stack space={4}>
                <TextInput
                  autoFocus
                  icon={SearchIcon}
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

                {visibleNames.length ? (
                  <Grid columns={[2, 3, 4, 5]} gap={2}>
                    {visibleNames.map((name) => (
                      <PickerOption
                        key={name}
                        name={name}
                        onSelect={selectIcon}
                        selected={name === selectedName}
                        svg={svgs[name]}
                      />
                    ))}
                  </Grid>
                ) : (
                  <Card padding={4} radius={2} tone="transparent">
                    <Text align="center" muted size={1}>
                      No icons match “{query}”.
                    </Text>
                  </Card>
                )}

                {visibleNames.length < filteredNames.length ? (
                  <Button
                    mode="ghost"
                    onClick={() => setLimit((current) => current + PAGE_SIZE)}
                    text={`Show ${Math.min(PAGE_SIZE, filteredNames.length - visibleNames.length)} more`}
                    type="button"
                    width="fill"
                  />
                ) : null}
              </Stack>
            ) : (
              <Text muted size={1}>
                Loading icons…
              </Text>
            )}
          </Box>
        </Dialog>
      ) : null}
    </>
  );
}
