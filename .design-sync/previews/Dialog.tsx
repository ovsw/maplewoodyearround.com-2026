import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "maplewood-year-round";

export const ScheduleTour = () => (
  <div className="h-[480px] bg-background">
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule a tour</DialogTitle>
          <DialogDescription>
            Tell us when to expect you. Tours take about 45 minutes.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="tour-name">Parent name</Label>
            <Input id="tour-name" placeholder="Jordan Lee" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tour-date">Preferred date</Label>
            <Input id="tour-date" type="date" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Request tour</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
);
