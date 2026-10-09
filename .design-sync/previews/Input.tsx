import { Input, Label } from "maplewood-year-round";

export const Default = () => (
  <div className="grid max-w-sm gap-2 bg-background p-6">
    <Label htmlFor="child-name">Child's name</Label>
    <Input id="child-name" placeholder="Sam Rivera" />
  </div>
);

export const Types = () => (
  <div className="grid max-w-sm gap-4 bg-background p-6">
    <Input type="email" placeholder="parent@example.com" />
    <Input type="date" />
    <Input type="search" placeholder="Search programs" />
  </div>
);

export const States = () => (
  <div className="grid max-w-sm gap-4 bg-background p-6">
    <Input defaultValue="Grade 3" />
    <Input placeholder="Disabled" disabled />
    <Input defaultValue="not-an-email" aria-invalid />
  </div>
);
