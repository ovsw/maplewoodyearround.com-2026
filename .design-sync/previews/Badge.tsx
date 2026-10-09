import { Badge } from "maplewood-year-round";

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-3 bg-background p-6">
    <Badge>Grades K to 2</Badge>
    <Badge variant="secondary">Grades 3 to 5</Badge>
    <Badge variant="outline">Full day</Badge>
    <Badge variant="destructive">Waitlist</Badge>
  </div>
);

export const OnCard = () => (
  <div className="flex max-w-sm flex-col gap-3 rounded-lg bg-card p-6 shadow-sm">
    <div className="flex gap-2">
      <Badge variant="outline">Summer Camp</Badge>
      <Badge variant="outline">Ages 5 to 12</Badge>
    </div>
    <p className="font-display text-title text-foreground">Swim and Explore</p>
    <p className="text-muted-foreground">
      Mornings in the pool, afternoons on the trail.
    </p>
  </div>
);
