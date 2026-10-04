"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "./newsletter.module.css";

export type NewsletterCopy = {
  heading?: string | null;
  description?: string | null;
  successMessage?: string | null;
  errorMessage?: string | null;
};

export function Newsletter({ copy = {} }: { copy?: NewsletterCopy }) {
  const id = useId();
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "pending") return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    setStatus("pending");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fields.get("email"),
          _honeypot: fields.get("_honeypot"),
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
