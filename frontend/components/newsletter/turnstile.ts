// Cloudflare Turnstile: an invisible bot check. Most visitors see nothing; a
// visitor that Cloudflare finds suspicious gets a checkbox to click.
// https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/

export type TurnstileOptions = {
  sitekey: string;
  action?: string;
  execution?: "render" | "execute";
  appearance?: "always" | "execute" | "interaction-only";
  retry?: "auto" | "never";
  callback?: (token: string) => void;
  "error-callback"?: (code: string) => void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
};

export type Turnstile = {
  render(container: HTMLElement, options: TurnstileOptions): string;
  execute(widgetId: string): void;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

// Cloudflare requires this exact URL; the script must not be self-hosted.
const scriptUrl =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loading: Promise<Turnstile> | undefined;

export function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement("script");
    // Let the next submission try again, for example after a network drop.
    const fail = (message: string) => {
      loading = undefined;
      script.remove();
      reject(new Error(message));
    };
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => {
      if (window.turnstile) resolve(window.turnstile);
      else fail("Turnstile did not start");
    };
    script.onerror = () => fail("Turnstile did not load");
    document.head.append(script);
  });
  return loading;
}
