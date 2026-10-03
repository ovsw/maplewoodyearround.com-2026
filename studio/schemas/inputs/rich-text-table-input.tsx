import { TableComponent, type TableRow } from "@sanity/table";
import { Box, Stack, TextInput } from "@sanity/ui";
import {
  FormField,
  set,
  unset,
  type ObjectInputProps,
} from "sanity";

type RichTextTableValue = {
  _key?: string;
  _type?: "table";
  rows?: TableRow[];
  title?: string;
};

export default function RichTextTableInput(
  props: ObjectInputProps<RichTextTableValue>,
) {
  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const title = event.currentTarget.value;
    props.onChange(title ? set(title, ["title"]) : unset(["title"]));
  };

  return (
    <Stack space={5}>
      <FormField path={[...props.path, "title"]} title="Table Title">
        <TextInput
          onChange={handleTitleChange}
          placeholder="Optional accessible table title"
          value={props.value?.title ?? ""}
        />
      </FormField>
      <FormField path={props.path} title="Table">
        <Box overflow="auto">
          <TableComponent {...props} rowType="tableRow" />
        </Box>
      </FormField>
    </Stack>
  );
}
