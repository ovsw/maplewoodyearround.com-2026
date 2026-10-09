import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "maplewood-year-round";

export const Faq = () => (
  <div className="max-w-xl bg-background p-6">
    <Accordion type="single" collapsible defaultValue="hours">
      <AccordionItem value="hours">
        <AccordionTrigger>What are the camp hours?</AccordionTrigger>
        <AccordionContent>
          Camp runs from 9 am to 4 pm. Extended care is available from 7 am
          and until 6 pm at no extra cost.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="lunch">
        <AccordionTrigger>Is lunch provided?</AccordionTrigger>
        <AccordionContent>
          Yes. A hot lunch and two snacks are included every day.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="bus">
        <AccordionTrigger>Do you offer bus service?</AccordionTrigger>
        <AccordionContent>
          Door to door bus service covers most of the county.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
);

export const Multiple = () => (
  <div className="max-w-xl bg-background p-6">
    <Accordion type="multiple" defaultValue={["swim", "arts"]}>
      <AccordionItem value="swim">
        <AccordionTrigger>Swim program</AccordionTrigger>
        <AccordionContent>Red Cross lessons every morning.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="arts">
        <AccordionTrigger>Creative arts</AccordionTrigger>
        <AccordionContent>Painting, pottery and drama.</AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
);
