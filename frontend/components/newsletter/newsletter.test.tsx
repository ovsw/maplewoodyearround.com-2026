import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Newsletter } from "./newsletter";
import type { Turnstile, TurnstileOptions } from "./turnstile";

// A stand-in for Cloudflare's widget: each execute() answers with the next
// token, or fails when the test says so.
function fakeTurnstile({ fail = false } = {}) {
  let options: TurnstileOptions | undefined;
  let issued = 0;
  const turnstile = {
    render: vi.fn((_: HTMLElement, given: TurnstileOptions) => {
      options = given;
      return "widget-1";
    }),
    execute: vi.fn(() =>
      queueMicrotask(() =>
        fail
          ? options?.["error-callback"]?.("300030")
          : options?.callback?.(`token-${++issued}`),
      ),
    ),
    reset: vi.fn(),
    remove: vi.fn(),
  } satisfies Turnstile;
  vi.stubGlobal("turnstile", turnstile);
  return turnstile;
}

const sentBodies = (submit: ReturnType<typeof vi.fn>) =>
  submit.mock.calls.map(([, init]) => JSON.parse(init.body));

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "test-site-key"));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("keeps the email after an error and announces a successful retry", async () => {
  const turnstile = fakeTurnstile();
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
  // Cloudflare accepts each token once, so every submission gets a new one.
  expect(sentBodies(submit)).toEqual([
    { email: "reader@example.com", _honeypot: "", turnstileToken: "token-1" },
    { email: "reader@example.com", _honeypot: "", turnstileToken: "token-2" },
  ]);
  expect(turnstile.render).toHaveBeenCalledTimes(1);
  expect(turnstile.render).toHaveBeenCalledWith(
    expect.any(HTMLElement),
    expect.objectContaining({
      sitekey: "test-site-key",
      execution: "execute",
      appearance: "interaction-only",
    }),
  );
  expect(turnstile.reset).toHaveBeenCalledWith("widget-1");
});

it("shows the error and sends nothing when the bot check fails", async () => {
  fakeTurnstile({ fail: true });
  const submit = vi.fn();
  vi.stubGlobal("fetch", submit);
  const user = userEvent.setup();
  render(<Newsletter />);
  await user.type(
    screen.getByRole("textbox", { name: "Email address" }),
    "reader@example.com",
  );
  await user.click(screen.getByRole("button", { name: "Subscribe" }));
  expect(
    await screen.findByText(
      "Oops! Something went wrong while submitting the form.",
    ),
  ).toBeInTheDocument();
  expect(submit).not.toHaveBeenCalled();
});

it("sends nothing when the site has no Turnstile key", async () => {
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
  const turnstile = fakeTurnstile();
  const submit = vi.fn();
  vi.stubGlobal("fetch", submit);
  const user = userEvent.setup();
  render(<Newsletter />);
  await user.type(
    screen.getByRole("textbox", { name: "Email address" }),
    "reader@example.com",
  );
  await user.click(screen.getByRole("button", { name: "Subscribe" }));
  expect(
    await screen.findByText(
      "Oops! Something went wrong while submitting the form.",
    ),
  ).toBeInTheDocument();
  expect(turnstile.render).not.toHaveBeenCalled();
  expect(submit).not.toHaveBeenCalled();
});
