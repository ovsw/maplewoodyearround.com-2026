import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "maplewood-year-round";

export const MobileMenu = () => (
  <div className="h-[480px] bg-background">
    <Sheet open modal={false}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Maplewood</SheetTitle>
          <SheetDescription>Summer Camp and School Year</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-4 px-4 text-lg font-bold">
          <a href="#">Summer Camp</a>
          <a href="#">School Year</a>
          <a href="#">About</a>
          <a href="#">Contact</a>
        </nav>
        <SheetFooter>
          <Button>Register</Button>
          <Button variant="outline">Schedule a Tour</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  </div>
);
