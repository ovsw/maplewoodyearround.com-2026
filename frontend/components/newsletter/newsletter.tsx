"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import Link from "next/link";
import styles from "./newsletter.module.css";
import { loadTurnstile } from "./turnstile";

export type NewsletterCopy = {
  heading?: string | null;
  description?: string | null;
  successMessage?: string | null;
  errorMessage?: string | null;
};

type PendingToken = {
  resolve(token: string): void;
  reject(error: Error): void;
};

// Gets a fresh Turnstile token for each submission. The script loads when
// the form nears the screen, so visitors who never scroll to the footer do
// not download it.
function useTurnstileToken(
  siteKey: string | undefined,
  container: RefObject<HTMLDivElement | null>,
) {
  const widget = useRef<string | undefined>(undefined);
  const pending = useRef<PendingToken | undefined>(undefined);

  useEffect(() => {
    const element = container.current;
    if (!element || !siteKey || typeof IntersectionObserver === "undefined")
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        loadTurnstile().catch(() => undefined);
      },
      { rootMargin: "600px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [siteKey, container]);

  useEffect(
    () => () => {
      if (widget.current) window.turnstile?.remove(widget.current);
    },
    [],
  );

  async function token() {
    if (!siteKey) throw new Error("Turnstile site key missing");
    const turnstile = await loadTurnstile();
    if (!container.current) throw new Error("Turnstile container missing");
    const settle = (finish: (handlers: PendingToken) => void) => {
      if (pending.current) finish(pending.current);
      pending.current = undefined;
    };
    const fail = () =>
      settle((handlers) => handlers.reject(new Error("Turnstile failed")));
    const result = new Promise<string>((resolve, reject) => {
      pending.current = { resolve, reject };
    });
    if (widget.current === undefined) {
      widget.current = turnstile.render(container.current, {
        sitekey: siteKey,
        action: "newsletter",
        execution: "execute",
        appearance: "interaction-only",
        retry: "never",
        callback: (value) => settle((handlers) => handlers.resolve(value)),
        "error-callback": fail,
        "expired-callback": fail,
        "timeout-callback": fail,
      });
    } else {
      turnstile.reset(widget.current);
    }
    turnstile.execute(widget.current);
    return result;
  }

  return token;
}

export function Newsletter({ copy = {} }: { copy?: NewsletterCopy }) {
  const id = useId();
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const challenge = useRef<HTMLDivElement>(null);
  const turnstileToken = useTurnstileToken(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    challenge,
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "pending") return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    setStatus("pending");
    try {
      const token = await turnstileToken();
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fields.get("email"),
          _honeypot: fields.get("_honeypot"),
          turnstileToken: token,
        }),
      });
      if (!response.ok) throw new Error("Submission failed");
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <section
      className={styles.newsletter}
      aria-label={copy.heading || "Newsletter"}
    >
      {copy.heading && <h2>{copy.heading}</h2>}
      {copy.description && <p>{copy.description}</p>}
      <form
        className={styles.form}
        onSubmit={submit}
        aria-busy={status === "pending"}
      >
        <label className="sr-only" htmlFor={`${id}-email`}>
          Email address
        </label>
        <input
          id={`${id}-email`}
          type="email"
          name="email"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="Enter your email"
          aria-describedby={`${id}-privacy ${id}-status`}
        />
        <div hidden aria-hidden="true">
          <label htmlFor={`${id}-website`}>Leave this field empty</label>
          <input
            id={`${id}-website`}
            name="_honeypot"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <button type="submit" disabled={status === "pending"}>
          {status === "pending" ? "Please wait..." : "Subscribe"}
        </button>
      </form>
      {/* Shows a checkbox only when Cloudflare needs the visitor to click. */}
      <div ref={challenge} />
      <p className={styles.privacy} id={`${id}-privacy`}>
        By subscribing you agree to our{" "}
        <Link href="/privacy-policy">Privacy Policy</Link> and provide consent
        to receive updates from Maplewood Enrichment Center.
      </p>
      <p
        className={styles.status}
        id={`${id}-status`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {status === "success" &&
          (copy.successMessage ||
            "Thank you! Your submission has been received!")}
        {status === "error" &&
          (copy.errorMessage ||
            "Oops! Something went wrong while submitting the form.")}
      </p>
    </section>
  );
}
