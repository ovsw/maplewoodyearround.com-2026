import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { client } from "@/sanity/lib/client";
import { token } from "@/sanity/lib/token";

const missingTokenMessage =
  "Missing SANITY_API_READ_TOKEN. Add it to frontend/.env.local to use Sanity Presentation draft previews.";

const draftModeHandler = token
  ? defineEnableDraftMode({
      client: client.withConfig({ token }),
    })
  : {
      GET: () => {
        console.error(missingTokenMessage);
        return new Response(missingTokenMessage, { status: 500 });
      },
    };

export const { GET } = draftModeHandler;
