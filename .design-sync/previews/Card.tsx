import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "maplewood-year-round";

export const ProgramCard = () => (
  <div className="bg-background p-6">
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Before and After School Care</CardTitle>
        <CardDescription>School Year, grades K to 5</CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Homework help, snacks and outdoor play from 7 am to 6 pm, with bus
          service to local elementary schools.
        </p>
      </CardContent>
      <CardFooter className="gap-3">
        <Button>Enroll</Button>
        <Button variant="outline">Details</Button>
      </CardFooter>
    </Card>
  </div>
);

export const OnCream = () => (
  <div className="bg-fill-cream p-6">
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Summer Camp 2026</CardTitle>
        <CardDescription>June 22 to August 21</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Nine weeks of swimming, sports, arts and field trips.</p>
      </CardContent>
    </Card>
  </div>
);

export const Grid = () => (
  <div className="grid grid-cols-1 gap-6 bg-background p-6 sm:grid-cols-2">
    {["Swim lessons", "Creative arts", "Sports", "Nature"].map((name) => (
      <Card key={name}>
        <CardHeader>
          <CardTitle>{name}</CardTitle>
          <CardDescription>Daily activity</CardDescription>
        </CardHeader>
      </Card>
    ))}
  </div>
);
