import { useEffect, useState } from "react";
import { Button, Card, Checkbox, Flex, Stack, Text } from "@sanity/ui";
import { type ArrayOfObjectsInputProps, set, unset, useClient } from "sanity";

type Grade = { _id: string; title?: string };
type GradeReference = { _key: string; _type: "reference"; _ref: string };

const newKey = () => Math.random().toString(36).slice(2, 14);

/**
 * Grades as checkboxes in school order, with an "All grades" button. The
 * stored list keeps school order too, whatever order the boxes are ticked in.
 */
export default function GradeCheckboxesInput(props: ArrayOfObjectsInputProps) {
  const { onChange, readOnly } = props;
  const value = (props.value ?? []) as GradeReference[];
  const client = useClient({ apiVersion: "2026-03-23" });
  const [grades, setGrades] = useState<Grade[]>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let current = true;
    client
      .fetch<Grade[]>(
        `*[_type == "grade" && !(_id in path("drafts.**"))] | order(order asc, title asc){_id, title}`,
      )
      .then((list) => current && setGrades(list))
      .catch(() => current && setFailed(true));
    return () => {
      current = false;
    };
  }, [client]);

  if (failed)
    return (
      <Card padding={3} radius={2} tone="critical">
        <Text size={1}>The grades could not be loaded. Reload the page to try again.</Text>
      </Card>
    );
  if (!grades) return <Text size={1}>Loading grades…</Text>;
  if (!grades.length)
    return (
      <Card padding={3} radius={2} tone="caution">
        <Text size={1}>Add the Grades first, under Grades in the menu.</Text>
      </Card>
    );

  const ticked = new Set(value.map((item) => item._ref));
  const store = (ids: Set<string>) => {
    const keys = new Map(value.map((item) => [item._ref, item._key]));
    const next = grades
      .filter((grade) => ids.has(grade._id))
      .map((grade): GradeReference => ({
        _key: keys.get(grade._id) ?? newKey(),
        _type: "reference",
        _ref: grade._id,
      }));
    onChange(next.length ? set(next) : unset());
  };
  const toggle = (id: string) => {
    const ids = new Set(ticked);
    if (ids.has(id)) ids.delete(id);
    else ids.add(id);
    store(ids);
  };
  const allTicked = grades.every((grade) => ticked.has(grade._id));

  return (
    <Stack space={3}>
      <Stack space={2}>
        {grades.map((grade) => (
          <Flex as="label" align="center" gap={2} key={grade._id}>
            <Checkbox
              checked={ticked.has(grade._id)}
              disabled={readOnly}
              onChange={() => toggle(grade._id)}
            />
            <Text size={1}>{grade.title}</Text>
          </Flex>
        ))}
      </Stack>
      <Flex>
        <Button
          disabled={readOnly || allTicked}
          fontSize={1}
          mode="ghost"
          onClick={() => store(new Set(grades.map((grade) => grade._id)))}
          padding={2}
          text="All grades"
        />
      </Flex>
    </Stack>
  );
}
