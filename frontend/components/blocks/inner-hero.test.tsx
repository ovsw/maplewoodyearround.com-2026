import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { expect, it } from "vitest";
import InnerHero from "./inner-hero";

it("keeps all three source Dates and Rates actions", () => {
  const hero: ComponentProps<typeof InnerHero> = {
    _key: "rates", _type: "innerHero", body: null, eyebrow: null, facts: null, image: null,
    title: [{_key:"title",_type:"block",style:"normal",markDefs:null,children:[{_key:"text",_type:"span",marks:[],text:"Dates and Rates"}]}],
    buttons: ["Rates", "Calendar", "Enroll"].map((text, index) => ({_key:String(index),_type:"button",text,href:`/action-${index}`,icon:null,openInNewTab:false,variant:"outline"})),
  };
  render(<InnerHero {...hero} />);
  expect(screen.getAllByRole("link")).toHaveLength(3);
  expect(screen.getByRole("link", {name:"Enroll"})).toHaveAttribute("href", "/action-2");
});
