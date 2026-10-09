import { TagLine } from "maplewood-year-round";

export const Default = () => (
  <div className="bg-background p-6">
    <TagLine title="Summer Camp" />
  </div>
);

export const AboveHeading = () => (
  <div className="bg-background p-6">
    <TagLine title="School Year" element="div" />
    <h2 className="mt-2 font-display text-headline text-foreground">
      Care that follows the school day
    </h2>
  </div>
);
