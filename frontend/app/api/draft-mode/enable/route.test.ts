import { beforeEach, describe, expect, it, vi } from "vitest";

const defineEnableDraftMode = vi.hoisted(() => vi.fn());
const withConfig = vi.hoisted(() => vi.fn(() => ({ configured: true })));
const tokenState = vi.hoisted(() => ({ value: undefined as string | undefined }));

vi.mock("next-sanity/draft-mode", () => ({ defineEnableDraftMode }));
vi.mock("@/sanity/lib/client", () => ({ client: { withConfig } }));
vi.mock("@/sanity/lib/token", () => ({
  get token() {
    return tokenState.value;
  },
}));

async function loadRoute() {
  vi.resetModules();
  return import("./route");
}

describe("draft mode enable route", () => {
  beforeEach(() => {
    defineEnableDraftMode.mockReset();
    withConfig.mockClear();
    tokenState.value = undefined;
  });

  it("returns a clear configuration error when the Sanity read token is missing", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { GET } = await loadRoute();

    const response = await GET(
      new Request("http://localhost:3000/api/draft-mode/enable"),
    );

    await expect(response.text()).resolves.toContain("Missing SANITY_API_READ_TOKEN");
    expect(response.status).toBe(500);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Missing SANITY_API_READ_TOKEN"),
    );
    expect(defineEnableDraftMode).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("uses the Sanity draft-mode handler when the read token is configured", async () => {
    const handler = vi.fn(() => new Response("enabled"));
    defineEnableDraftMode.mockReturnValue({ GET: handler });
    tokenState.value = "read-token";

    const { GET } = await loadRoute();

    expect(withConfig).toHaveBeenCalledWith({ token: "read-token" });
    expect(defineEnableDraftMode).toHaveBeenCalledWith({
      client: { configured: true },
    });
    expect(GET).toBe(handler);
  });
});
