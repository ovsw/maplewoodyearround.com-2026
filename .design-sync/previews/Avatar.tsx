import { Avatar, AvatarFallback } from "maplewood-year-round";

export const Initials = () => (
  <div className="flex items-center gap-4 bg-background p-6">
    <Avatar>
      <AvatarFallback>JM</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>SR</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>
  </div>
);

export const WithName = () => (
  <div className="flex items-center gap-3 bg-background p-6">
    <Avatar className="size-12">
      <AvatarFallback>DK</AvatarFallback>
    </Avatar>
    <div>
      <p className="font-semibold text-foreground">Dana Kim</p>
      <p className="text-sm text-muted-foreground">Camp Director</p>
    </div>
  </div>
);
