import { createClient } from "@sanity/client";
import { documentEventHandler } from "@sanity/functions";

import { getPresentationPath } from "../../presentation/routes.ts";
import {
  autoRedirectId,
  planAutoRedirect,
  resolveFetchedRedirectDestination,
  shouldWriteAutoRedirect,
  type AutoRedirectEventData,
  type FetchedRedirect,
} from "./model.ts";

const API_VERSION = "2026-03-23";

export const handler = documentEventHandler<AutoRedirectEventData>(
  async ({ context, event }) => {
    const client = createClient({
      ...context.clientOptions,
      apiVersion: API_VERSION,
      perspective: "published",
      useCdn: false,
    });

    const [rawRedirects, rawLiveRoutes] = await Promise.all([
      client.fetch<FetchedRedirect[]>(`
        *[
          _type == "redirect" &&
          !(_id in path("drafts.**"))
        ]{
          _id,
          _rev,
          status,
          source,
          destination,
          destinationReference,
          "destinationDocument": destinationReference->{
            _id,
            _type,
            "slug": slug.current
          },
          permanent
        }
      `),
      client.fetch<{ _id: string; _type: string; slug: string }[]>(
        `*[
          _type in ["page", "post", "category"] &&
          !(_id in path("drafts.**")) &&
          _id != $documentId &&
          defined(slug.current)
        ]{
          _id,
          _type,
          "slug": slug.current
        }`,
        { documentId: event.data.documentId ?? "" },
      ),
    ]);
    const liveRoutes = rawLiveRoutes.map((route) => ({
      _id: route._id,
      path: getPresentationPath(route._type, route.slug) ?? undefined,
    }));
    const redirects = rawRedirects.map((redirect) => ({
      ...redirect,
      destination: resolveFetchedRedirectDestination(redirect),
    }));

    const plan = planAutoRedirect({
      event: event.data,
      liveRoutes,
      redirects,
    });
    if (plan.action === "skip") {
      console.info(`Auto redirect skipped: ${plan.reason}`);
      return;
    }
    if (
      !plan.create &&
      plan.retarget.length === 0 &&
      plan.retire.length === 0
    ) {
      console.info(`Auto redirect already exists: ${plan.source}`);
      return;
    }
    if (!shouldWriteAutoRedirect(context.local)) {
      console.info(
        `Auto redirect local test: would apply ${plan.source} -> ${plan.destination}`,
      );
      return;
    }

    const destination = { _type: "slug", current: plan.destination };
    const destinationReference = {
      _type: "reference",
      _ref: plan.destinationDocumentId,
    };
    const transaction = client.transaction();
    for (const redirect of plan.retire) {
      transaction.patch(redirect._id, (patch) => {
        const guardedPatch = redirect._rev
          ? patch.ifRevisionId(redirect._rev)
          : patch;
        return guardedPatch.set({ status: "inactive" });
      });
    }
    for (const redirect of plan.retarget) {
      transaction.patch(redirect._id, (patch) => {
        const guardedPatch = redirect._rev
          ? patch.ifRevisionId(redirect._rev)
          : patch;
        return guardedPatch.set({ destination, destinationReference });
      });
    }
    if (plan.create) {
      // Function events are delivered at least once. Deriving the id from the
      // source keeps a redelivered publish from creating a second redirect that
      // would collide with this one in the topology rules.
      transaction.createIfNotExists({
        _id: autoRedirectId(plan.source),
        _type: "redirect",
        status: "active",
        source: { _type: "slug", current: plan.source },
        destination,
        destinationReference,
        permanent: "true",
      });
    }

    await transaction.commit();
    console.info(
      `Auto redirect applied: ${plan.source} -> ${plan.destination}`,
    );
  },
);
