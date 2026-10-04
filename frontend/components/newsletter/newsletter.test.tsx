import { afterEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Newsletter } from "./newsletter";

afterEach(() => vi.unstubAllGlobals());

it("keeps the email after an error and announces a successful retry", async () => {
  const submit = vi
    .fn()
    .mockResolvedValueOnce({ ok: false })
    .mockResolvedValueOnce({ ok: true });
  vi.stubGlobal("fetch", submit);
  const user = userEvent.setup();
  render(<Newsletter />);
  const email = screen.getByRole("textbox", { name: "Email address" });
  await user.type(email, "reader@example.com");
  await user.click(screen.getByRole("button", { name: "Subscribe" }));
  expect(
    await screen.findByText(
      "Oops! Something went wrong while submitting the form.",
    ),
  ).toBeInTheDocument();
  expect(email).toHaveValue("reader@example.com");
  await user.click(screen.getByRole("button", { name: "Subscribe" }));
  expect(
    await screen.findByText("Thank you! Your submission has been received!"),
  ).toHaveAttribute("role", "status");
  expect(email).toHaveValue("");
  expect(submit).toHaveBeenCalledTimes(2);
});
