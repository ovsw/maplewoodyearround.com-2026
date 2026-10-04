import { useEffect, useRef } from "react";
import {
  ArrowDown as ArrowDownIcon,
  ArrowUp as ArrowUpIcon,
  EllipsisVertical,
  Plus as AddIcon,
  Trash2 as TrashIcon,
} from "lucide-react";
import { Box, Button, Card, Menu, MenuButton, MenuItem, Stack, Text, TextInput } from "@sanity/ui";
import {
  type ArrayOfObjectsInputProps,
  insert,
  type Path,
  set,
  setIfMissing,
  unset,
  useFormValue,
} from "sanity";

type RateColumn = { _key: string; label?: string };
type RateRow = { _key: string; _type?: string; label?: string; cells?: string[] };

const newKey = () => Math.random().toString(36).slice(2, 14);

/**
 * Price grid for a rate table. Its columns come from the section's column
 * list: the first column holds the row headings, each further column one
 * program. Every row therefore shows exactly one value per program column,
 * and editing a row stores its values at that width.
 */
export default function RateTableRowsInput(props: ArrayOfObjectsInputProps) {
  const { onChange, path, readOnly, focusPath, onPathFocus } = props;
  const rows = (props.value ?? []) as RateRow[];
  const columns = (useFormValue([...path.slice(0, -1), "columns"]) ?? []) as RateColumn[];
  const [heading, ...programs] = columns;
  const width = programs.length;
  const grid = useRef<HTMLDivElement>(null);

  // Presentation opens a clicked price here; focus that exact field.
  useEffect(() => {
    const [row, field, index] = focusPath as Path;
    if (!row || typeof row !== "object" || !("_key" in row)) return;
    const id = field === "cells" && typeof index === "number" ? `${row._key}-cell-${index}` : `${row._key}-label`;
    grid.current?.querySelector<HTMLInputElement>(`[data-cell="${id}"]`)?.focus();
  }, [focusPath]);

  const cellsOf = (row: RateRow) => Array.from({ length: width }, (_, i) => row.cells?.[i] ?? "");
  const setCell = (row: RateRow, index: number, text: string) => {
    const cells = cellsOf(row);
    cells[index] = text;
    onChange(set(cells, [{ _key: row._key }, "cells"]));
  };
  const addRow = () =>
    onChange([
      setIfMissing([]),
      insert([{ _key: newKey(), _type: "rateRow", label: "", cells: Array(width).fill("") }], "after", [-1]),
    ]);
  const move = (index: number, step: number) => {
    const next = [...rows];
    const [row] = next.splice(index, 1);
    next.splice(index + step, 0, row);
    onChange(set(next));
  };

  if (width < 2) {
    return (
      <Card padding={3} radius={2} tone="caution">
        <Text size={1}>
          Add the columns first: one for the row headings, then one for each program (2 or 3).
        </Text>
      </Card>
    );
  }

  const template = `minmax(4.5rem, 1.2fr) repeat(${width}, minmax(4rem, 1fr)) 2rem`;
  return (
    <Stack space={3}>
      <Box ref={grid} style={{ overflowX: "auto" }}>
        <Stack space={2}>
          <div style={{ display: "grid", gridTemplateColumns: template, gap: "0.375rem" }}>
            {[heading, ...programs].map((column, index) => (
              <Text key={column?._key ?? index} size={1} weight="semibold">
                {column?.label || (index ? `Column ${index + 1}` : "Row heading")}
              </Text>
            ))}
            <span />
          </div>
          {rows.map((row, rowIndex) => {
            const extra = (row.cells?.length ?? 0) > width;
            return (
              <Card key={row._key} padding={1} radius={2} tone={extra ? "caution" : "default"}>
                <div style={{ display: "grid", gridTemplateColumns: template, gap: "0.375rem", alignItems: "center" }}>
                  <TextInput
                    aria-label={`Row ${rowIndex + 1} heading`}
                    data-cell={`${row._key}-label`}
                    onChange={(event) => onChange(set(event.currentTarget.value, [{ _key: row._key }, "label"]))}
                    onFocus={() => onPathFocus([{ _key: row._key }, "label"])}
                    fontSize={1}
                    padding={2}
                    readOnly={readOnly}
                    value={row.label ?? ""}
                  />
                  {cellsOf(row).map((cell, index) => (
                    <TextInput
                      aria-label={`${row.label || `Row ${rowIndex + 1}`}: ${programs[index]?.label || `column ${index + 2}`}`}
                      data-cell={`${row._key}-cell-${index}`}
                      key={programs[index]?._key ?? index}
                      onChange={(event) => setCell(row, index, event.currentTarget.value)}
                      onFocus={() => onPathFocus([{ _key: row._key }, "cells", index])}
                      fontSize={1}
                      padding={2}
                      readOnly={readOnly}
                      value={cell}
                    />
                  ))}
                  <MenuButton
                    button={<Button aria-label={`Row ${rowIndex + 1} options`} disabled={readOnly} icon={EllipsisVertical} mode="bleed" padding={2} />}
                    id={`${row._key}-menu`}
                    menu={
                      <Menu>
                        <MenuItem disabled={rowIndex === 0} icon={ArrowUpIcon} onClick={() => move(rowIndex, -1)} text="Move up" />
                        <MenuItem disabled={rowIndex === rows.length - 1} icon={ArrowDownIcon} onClick={() => move(rowIndex, 1)} text="Move down" />
                        <MenuItem icon={TrashIcon} onClick={() => onChange(unset([{ _key: row._key }]))} text="Remove row" tone="critical" />
                      </Menu>
                    }
                    popover={{ portal: true, placement: "left" }}
                  />
                </div>
                {extra ? (
                  <Box paddingX={2} paddingTop={2}>
                    <Text size={1}>
                      This row has extra values that the page does not show. Editing any value in the row removes them.
                    </Text>
                  </Box>
                ) : null}
              </Card>
            );
          })}
        </Stack>
      </Box>
      <Button disabled={readOnly} icon={AddIcon} mode="ghost" onClick={addRow} text="Add row" />
    </Stack>
  );
}
