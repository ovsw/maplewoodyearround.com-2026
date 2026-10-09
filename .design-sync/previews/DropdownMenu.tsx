import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "maplewood-year-round";

export const Programs = () => (
  <div className="h-[360px] bg-background p-6">
    <DropdownMenu open modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Programs</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Summer Camp</DropdownMenuLabel>
        <DropdownMenuItem>Day Camp</DropdownMenuItem>
        <DropdownMenuItem>Teen Travel</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>School Year</DropdownMenuLabel>
        <DropdownMenuItem>Preschool</DropdownMenuItem>
        <DropdownMenuItem>Before and After Care</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Cancel enrollment</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);
