import { Input, Label } from "maplewood-year-round";

export const WithInput = () => (
  <div className="grid max-w-sm gap-2 bg-background p-6">
    <Label htmlFor="grade">Grade in September</Label>
    <Input id="grade" placeholder="Kindergarten" />
  </div>
);

export const Standalone = () => (
  <div className="flex items-center gap-6 bg-background p-6">
    <Label>Session</Label>
    <Label>Pickup time</Label>
    <Label>Emergency contact</Label>
  </div>
);
