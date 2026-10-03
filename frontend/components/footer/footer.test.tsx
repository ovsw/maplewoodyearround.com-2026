import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "./site-footer";
import type { FooterModel } from "./model";

const link = (
  key: string,
  label: string,
  href: string,
  openInNewTab = false,
) => ({ key, label, href, openInNewTab });

const model: FooterModel = {
  eyebrow: "Your next chapter",
  heading: "Until next summer,",
  accent: "see you on the island",
  actions: [link("enroll", "Enroll", "https://example.com", true)],
  logos: [
    {
      key: "site",
      alt: "Maplewood Year Round logo",
      image: {
        src: "https://cdn.sanity.io/images/test-project/test/logo.png",
        width: 200,
        height: 100,
      },
      link: link("site", "Maplewood Year Round logo", "/"),
    },
  ],
  contactLinks: [
    {
      icon: "pin",
      link: link(
        "address",
        "10 Main Street\nExample City",
        "https://maps.example.com",
        true,
      ),
    },
    {
      icon: "email",
      link: link("email", "hello@example.com", "mailto:hello@example.com"),
    },
  ],
  columns: [
    {
      key: "company",
      heading: "Company",
      links: [
        link("about", "About", "/about"),
        link("instagram", "Instagram", "https://www.instagram.com/camp"),
        link("youtube", "YouTube", "https://youtube.com/@camp"),
        link("facebook", "Facebook", "https://m.facebook.com/camp"),
      ],
    },
  ],
  legalLinks: [link("privacy", "Privacy", "/privacy")],
  copyrightYears: "2024-2026",
  copyrightOwner: "Northline Studio",
};

describe("SiteFooter", () => {
  it("renders sign-off, logos, navigation, and linked contact rows", () => {
    render(<SiteFooter model={model} />);
    const footer = screen.getByRole("contentinfo");

    expect(
      within(footer).getByRole("heading", { name: /Until next summer/ }),
    ).toHaveAttribute("id", "site-footer-heading");
    expect(
      within(footer).getByRole("img", {
        name: "Maplewood Year Round logo",
      }),
    ).toBeInTheDocument();
    expect(
      within(footer).getByRole("heading", { name: "Company" }),
    ).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );
    expect(
      within(footer)
        .getByRole("link", { name: "Instagram" })
        .querySelector('[data-footer-icon="instagram"]'),
    ).toBeInTheDocument();
    expect(
      within(footer)
        .getByRole("link", { name: "YouTube" })
        .querySelector('[data-footer-icon="youtube"]'),
    ).toBeInTheDocument();
    expect(
      within(footer)
        .getByRole("link", { name: "Facebook" })
        .querySelector('[data-footer-icon="facebook"]'),
    ).toBeInTheDocument();
    expect(
      within(footer).getByRole("link", { name: "About" }).querySelector("svg"),
    ).not.toBeInTheDocument();
    expect(
      within(footer).getByRole("link", { name: /10 Main Street/ }),
    ).toHaveAttribute("href", "https://maps.example.com");
    expect(document.querySelector('a[href="#"]')).not.toBeInTheDocument();
  });

  it("maps editable footer copy to its Sanity paths", () => {
    const dataAttribute = (path: string) => `field:${path}`;
    render(<SiteFooter dataAttribute={dataAttribute} model={model} />);

    expect(
      document.querySelector('[data-sanity="field:eyebrow"]'),
    ).toHaveTextContent("Your next chapter");
    expect(
      document.querySelector('[data-sanity="field:copyrightStartYear"]'),
    ).toHaveTextContent("2024-2026");
    expect(
      document.querySelector('[data-sanity="field:copyrightOwner"]'),
    ).toHaveTextContent("Northline Studio");
  });
});
