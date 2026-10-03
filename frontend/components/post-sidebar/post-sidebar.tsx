import { ChevronRight, ExternalLink, Mail, Phone } from "lucide-react";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import { getSafeLinkHref } from "@/lib/safe-href";
import type { BlogPostSidebar, PostHeading } from "./model";
import { PostTableOfContents } from "./table-of-contents";

type Action = NonNullable<BlogPostSidebar["actions"]>[number];
type DataAttribute = (path: string) => string | undefined;

function getActionIcon(href: string, isInternal: boolean) {
  if (isInternal) return <ChevronRight aria-hidden="true" />;
  if (href.startsWith("tel:")) return <Phone aria-hidden="true" />;
  if (href.startsWith("mailto:")) return <Mail aria-hidden="true" />;
  return <ExternalLink aria-hidden="true" />;
}

/** Wraps children in the right element for the destination, preserving rel/target rules. */
function ActionLink({
  children,
  dataAttribute,
  href,
  openInNewTab,
  path,
}: {
  children: React.ReactNode;
  dataAttribute?: DataAttribute;
  href: string;
  openInNewTab: boolean;
  path: string;
}) {
  const isInternal = href.startsWith("/") && !href.startsWith("//");
  const isHttp = /^https?:\/\//i.test(href);
  const dataSanity = dataAttribute?.(`${path}.button.text`);

  return isInternal ? (
    <Link data-sanity={dataSanity} href={href}>
      {children}
    </Link>
  ) : (
    <a
      data-sanity={dataSanity}
      href={href}
      rel={isHttp && openInNewTab ? "noopener noreferrer" : undefined}
      target={isHttp && openInNewTab ? "_blank" : undefined}
    >
      {children}
    </a>
  );
}

function SidebarAction({
  action,
  dataAttribute,
  path,
}: {
  action: Action;
  dataAttribute?: DataAttribute;
  path: string;
}) {
  const href = getSafeLinkHref("href" in action ? action.href : null);
  const label = "text" in action ? action.text : null;
  if (!href || !label) return null;

  const isInternal = href.startsWith("/") && !href.startsWith("//");
  const openInNewTab =
    "openInNewTab" in action && stegaClean(action.openInNewTab) === true;

  return (
    <p data-sanity={dataAttribute?.(path)}>
      {action.description ? (
        <span data-sanity={dataAttribute?.(`${path}.description`)}>
          {action.description}
          {" "}
        </span>
      ) : null}
      <ActionLink
        dataAttribute={dataAttribute}
        href={href}
        openInNewTab={openInNewTab}
        path={path}
      >
        <span>{label}</span>
        {getActionIcon(href, isInternal)}
      </ActionLink>
    </p>
  );
}

export function PostSidebar({
  dataAttribute,
  sidebar,
}: {
  dataAttribute?: DataAttribute;
  sidebar: BlogPostSidebar | null;
}) {
  const actions = sidebar?.actions ?? [];
  if (!sidebar || actions.length === 0) return null;

  const [leadAction, ...restActions] = actions;

  return (
    <aside
      aria-label="Post actions"
      data-sanity={dataAttribute?.("actions")}
    >
      {sidebar.title || sidebar.description ? (
        <header>
          {sidebar.title ? (
            <h2 data-sanity={dataAttribute?.("title")}>{sidebar.title}</h2>
          ) : null}
          {sidebar.description ? (
            <p data-sanity={dataAttribute?.("description")}>
              {sidebar.description}
            </p>
          ) : null}
        </header>
      ) : null}
      {[leadAction, ...restActions].map((action) => {
        if (!action) return null;
        const actionKey = stegaClean(action._key);
        const actionPath = `actions[_key=="${actionKey}"]`;

        return (
          <section key={actionKey}>
            {action.title ? (
              <h3 data-sanity={dataAttribute?.(`${actionPath}.title`)}>
                {action.title}
              </h3>
            ) : null}
            <SidebarAction
              action={action}
              dataAttribute={dataAttribute}
              path={actionPath}
            />
          </section>
        );
      })}
    </aside>
  );
}

export function PostTableOfContentsRail({ headings }: { headings: PostHeading[] }) {
  return (
    <aside aria-label="Post table of contents">
      <details open>
        <summary>Table of contents</summary>
        <PostTableOfContents headings={headings} />
      </details>
    </aside>
  );
}
