import { TableComponent } from "@sanity/table";
import { Box } from "@sanity/ui";
import type { ObjectInputProps } from "sanity";

/**
 * Spreadsheet-style editor for the comparison table, reusing the same
 * @sanity/table grid as rich-text tables. Header structure follows the
 * conventions documented on the field (row 1 is the header row; option
 * header cells may use the "Eyebrow|Title" form).
 */
export default function ComparisonTableInput(props: ObjectInputProps) {
  return (
    <Box overflow="auto">
      <TableComponent {...props} rowType="tableRow" />
    </Box>
  );
}
