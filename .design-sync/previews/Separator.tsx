import { Separator } from "maplewood-year-round";

export const Horizontal = () => (
  <div className="max-w-sm bg-background p-6">
    <p className="font-semibold text-foreground">Summer Camp</p>
    <p className="text-sm text-muted-foreground">June 22 to August 21</p>
    <Separator className="my-4" />
    <p className="font-semibold text-foreground">School Year</p>
    <p className="text-sm text-muted-foreground">September to June</p>
  </div>
);

export const Vertical = () => (
  <div className="bg-background p-6 text-sm">
    <div className="flex h-6 items-center gap-4">
      <span>Programs</span>
      <Separator orientation="vertical" />
      <span>Calendar</span>
      <Separator orientation="vertical" />
      <span>Contact</span>
    </div>
  </div>
);
