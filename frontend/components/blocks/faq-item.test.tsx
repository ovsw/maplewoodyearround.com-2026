import { render, screen } from "@testing-library/react";
import { PortableText } from "@portabletext/react";
import { describe, expect, it } from "vitest";
import { faqAnswerComponents } from "./faq-item";
import { faqAccordionQuery } from "@/sanity/queries/faq-accordion";
import { faqHubQuery } from "@/sanity/queries/faq-hub";

describe("imported FAQ answers", () => {
  it("renders lists, linked buttons, tables and callouts", () => {
    render(<PortableText components={faqAnswerComponents()} value={[
      {_key:"list",_type:"block",style:"normal",listItem:"bullet",level:1,children:[{_key:"text",_type:"span",text:"Bring a towel",marks:[]}],markDefs:[]},
      {_key:"link",_type:"block",style:"normal",children:[{_key:"text",_type:"span",text:"Download",marks:["button"]}],markDefs:[{_key:"button",_type:"buttonLink",href:"/download",variant:"outline"}]},
      {_key:"table",_type:"table",rows:[{_key:"head",cells:["Time"]},{_key:"row",cells:["9 am"]}]},
      {_key:"callout",_type:"callout",title:"Note",body:"Bring water"},
    ]} />);
    expect(screen.getByRole("listitem")).toHaveTextContent("Bring a towel");
    expect(screen.getByRole("link", {name:"Download"})).toHaveAttribute("href","/download");
    expect(screen.getByRole("table")).toHaveTextContent("9 am");
    expect(screen.getByText("Bring water")).toBeInTheDocument();
  });
  it("resolves images and button links in both FAQ views", () => {
    for (const query of [faqAccordionQuery, faqHubQuery]) {
      expect(query).toContain('"resolvedAsset": asset->');
      expect(query).toContain('["customLink", "buttonLink"]');
    }
    expect(faqAnswerComponents().types).toHaveProperty("image");
  });
});
