import { Button } from "maplewood-year-round";

export const Roles = () => (
  <div className="flex flex-wrap items-center gap-4 bg-background p-6">
    <Button>Register for Summer Camp</Button>
    <Button variant="outline">Schedule a Tour</Button>
    <Button variant="ghost">See the calendar</Button>
    <Button variant="link">All programs</Button>
  </div>
);

export const Sizes = () => (
  <div className="flex flex-wrap items-center gap-4 bg-background p-6">
    <Button size="compact">Compact</Button>
    <Button>Default</Button>
    <Button size="hero" emphasis>
      Enroll for Summer 2026
    </Button>
  </div>
);

export const OnDark = () => (
  <div className="flex flex-wrap items-center gap-4 bg-fill-forest p-6">
    <Button>Register Now</Button>
    <Button variant="outline" onDark>
      Schedule a Tour
    </Button>
    <Button variant="ghost" onDark>
      Learn more
    </Button>
  </div>
);

export const States = () => (
  <div className="flex flex-wrap items-center gap-4 bg-background p-6">
    <Button disabled>Registration closed</Button>
    <Button variant="outline" disabled>
      Waitlist full
    </Button>
    <Button variant="destructive">Cancel enrollment</Button>
  </div>
);
