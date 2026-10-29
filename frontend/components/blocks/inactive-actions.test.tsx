import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import { SourceActions, visibleActions } from "./maplewood-inner";
import PricingCards from "./pricing-cards";
import { contentActionsProjection } from "@/sanity/queries/shared/maplewood";

const form = { href: "https://airtable.com/form", openInNewTab: true };

describe("inactive buttons", () => {
  it("keeps an inactive button's text but drops its link", () => {
    expect(
      visibleActions([
        { _key: "closed", label: "Registration Begins November 23rd", inactive: true, destination: form },
        { _key: "closed-empty", label: "Coming soon", inactive: true },
        { _key: "open", label: "Register Online", destination: form },
        { _key: "empty", label: "No destination" },
        { _key: "blank", label: " ", inactive: true },
      ]).map(({ _key, href }) => [_key, href]),
    ).toEqual([
      ["closed", null],
      ["closed-empty", null],
      ["open", "https://airtable.com/form"],
    ]);
  });

  it("shows an inactive section button as text next to working links", () => {
    render(
      <SourceActions
        actions={[
          { _key: "closed", label: "Registration Begins November 23rd", inactive: true, destination: form },
          { _key: "open", label: "Contact us", destination: { href: "/contact" } },
        ]}
      />,
    );
    expect(screen.getByText("Registration Begins November 23rd").closest("a")).toBeNull();
    expect(screen.getByRole("link", { name: "Contact us" })).toHaveAttribute("href", "/contact");
  });

  it("shows an inactive pricing-card button as text", () => {
    const plan = (key: string, inactive: boolean) => ({
      _key: key,
      accent: null,
      actions: [{ _key: `${key}-action`, destination: form, inactive, label: inactive ? "Registration Begins November 23rd" : "Register Online" }],
      details: null,
      icon: null,
      price: "$4,450/season",
      title: key,
    });
    render(
      <PricingCards
        {...({
          _key: "pricing",
          _type: "pricingCards",
          plans: [plan("2-Day Preschool", true), plan("3-Day Preschool", false)],
          title: "Preschool Pricing",
        } as unknown as ComponentProps<typeof PricingCards>)}
      />,
    );
    expect(screen.getByText("Registration Begins November 23rd").closest("a")).toBeNull();
    expect(screen.getByRole("link", { name: "Register Online" })).toHaveAttribute("href", form.href);
  });

  it("reads the switch with every button", () => {
    expect(contentActionsProjection).toContain("inactive");
  });
});
