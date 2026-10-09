import { useEffect } from "react";
import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  useForm,
} from "maplewood-year-round";

function Newsletter({ withError = false }: { withError?: boolean }) {
  const form = useForm({ defaultValues: { email: withError ? "jordan" : "" } });
  useEffect(() => {
    if (withError)
      form.setError("email", { message: "Enter a valid email address." });
  }, [withError, form]);
  return (
    <Form {...form}>
      <form className="grid max-w-md gap-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email address</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormDescription>
                Camp news and registration dates, about once a month.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="justify-self-start">
          Subscribe
        </Button>
      </form>
    </Form>
  );
}

export const Default = () => (
  <div className="bg-background p-6">
    <Newsletter />
  </div>
);

export const WithError = () => (
  <div className="bg-background p-6">
    <Newsletter withError />
  </div>
);
