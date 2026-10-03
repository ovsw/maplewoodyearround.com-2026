import PortableTextRenderer from "@/components/portable-text-renderer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { Mail, Phone } from "lucide-react";
import { stegaClean } from "next-sanity";
import Image from "next/image";

type TeamMembersBlock = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "teamMembers" }
>;

type TeamMemberReference = NonNullable<TeamMembersBlock["members"]>[number];
type TeamMemberDocument = NonNullable<TeamMemberReference["document"]>;

type TeamMembersProps = TeamMembersBlock & {
  dataAttribute?: (path: string) => string | undefined;
  memberDataAttribute?: (
    documentId: string,
    path: string,
  ) => string | undefined;
};

function ProfileMeta({
  member,
  memberDataAttribute,
}: Readonly<{
  member: TeamMemberDocument;
  memberDataAttribute?: TeamMembersProps["memberDataAttribute"];
}>) {
  const role = stegaClean(member.role)?.trim();

  if (!role) return null;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span
        className="inline-flex items-center gap-2.5 text-label text-soft-foreground"
        data-sanity={memberDataAttribute?.(member._id, "role")}
      >
        <span
          aria-hidden="true"
          className="size-[7px] shrink-0 rounded-full bg-primary"
        />
        {member.role}
      </span>
    </div>
  );
}

function ProfileContact({
  member,
  memberDataAttribute,
}: Readonly<{
  member: TeamMemberDocument;
  memberDataAttribute?: TeamMembersProps["memberDataAttribute"];
}>) {
  const email = stegaClean(member.email)?.trim();
  const name = stegaClean(member.name)?.trim();
  const phone = stegaClean(member.phone)?.trim();

  if (!(email || phone)) return null;

  const firstName = name?.split(/\s+/)[0] || "Team Member";
  const phoneHref = phone?.replace(/[^+\d]/g, "");

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-3.5">
      {email ? (
        <a
          className={cn(buttonVariants({ size: "compact", variant: "outline" }), "no-underline")}
          data-sanity={memberDataAttribute?.(member._id, "email")}
          href={`mailto:${email}`}
        >
          <Mail aria-hidden="true" className="size-4" strokeWidth={1.7} />
          Email {firstName}
        </a>
      ) : null}
      {phone && phoneHref ? (
        <a
          className="inline-flex items-center gap-2.5 px-1 py-[0.6875rem] typo-button text-primary no-underline transition-opacity motion-fast hover:opacity-75 focus-underline"
          data-sanity={memberDataAttribute?.(member._id, "phone")}
          href={`tel:${phoneHref}`}
        >
          <Phone aria-hidden="true" className="size-4" strokeWidth={1.7} />
          {member.phone}
        </a>
      ) : null}
    </div>
  );
}

function TeamMemberProfile({
  index,
  member,
  memberDataAttribute,
  referenceDataAttribute,
}: Readonly<{
  index: number;
  member: TeamMemberDocument;
  memberDataAttribute?: TeamMembersProps["memberDataAttribute"];
  referenceDataAttribute?: string;
}>) {
  const hasName = Boolean(stegaClean(member.name)?.trim());
  const hasRole = Boolean(stegaClean(member.role)?.trim());
  const hasBio = Boolean(member.bio?.length);
  const hasEmail = Boolean(stegaClean(member.email)?.trim());
  const hasPhone = Boolean(stegaClean(member.phone)?.trim());
  const hasImage = Boolean(member.image?.asset?._id);

  if (!(hasName || hasRole || hasImage || hasBio || hasEmail || hasPhone)) {
    return null;
  }

  const reverse = index % 2 === 1;

  return (
    <article
      className="grid items-center gap-split md:grid-cols-[0.82fr_1.18fr]"
      data-sanity={referenceDataAttribute}
    >
      {hasImage && member.image ? (
        <div
          className={cn(
            "aspect-[4/5] w-full max-w-[26.25rem] overflow-hidden rounded-card bg-muted shadow-ambient-feature",
            reverse && "md:order-2 md:justify-self-end",
          )}
        >
          <Image
            alt={stegaClean(member.image.alt) || ""}
            blurDataURL={member.image.asset?.metadata?.lqip || undefined}
            className="h-full w-full object-cover"
            data-sanity={memberDataAttribute?.(member._id, "image")}
            height={900}
            loading="lazy"
            placeholder={member.image.asset?.metadata?.lqip ? "blur" : undefined}
            sizes="(min-width: 768px) 42vw, min(100vw - 2rem, 420px)"
            src={urlFor(member.image).width(720).height(900).url()}
            width={720}
          />
        </div>
      ) : null}
      <div className={cn("grid gap-(--space-stack)", reverse && "md:order-1")}>
        {hasName ? (
          <h3
            className="text-balance typo-feature-heading text-foreground"
            data-sanity={memberDataAttribute?.(member._id, "name")}
          >
            {member.name}
          </h3>
        ) : null}
        <ProfileMeta
          member={member}
          memberDataAttribute={memberDataAttribute}
        />
        {hasBio ? (
          <div
            className="max-w-[35rem] text-pretty typo-body-editorial text-muted-foreground [&_p]:!my-0"
            data-sanity={memberDataAttribute?.(member._id, "bio")}
          >
            <PortableTextRenderer value={member.bio ?? []} />
          </div>
        ) : null}
        <ProfileContact
          member={member}
          memberDataAttribute={memberDataAttribute}
        />
      </div>
    </article>
  );
}

function TeamMemberRosterCard({
  member,
  memberDataAttribute,
  referenceDataAttribute,
}: Readonly<{
  member: TeamMemberDocument;
  memberDataAttribute?: TeamMembersProps["memberDataAttribute"];
  referenceDataAttribute?: string;
}>) {
  const hasImage = Boolean(member.image?.asset?._id);
  const hasName = Boolean(stegaClean(member.name)?.trim());
  const hasRole = Boolean(stegaClean(member.role)?.trim());

  const hasShortBio = Boolean(stegaClean(member.shortBio)?.trim());
  const yearsAtOrganization = member.yearsAtOrganization;
  const experience = yearsAtOrganization != null && yearsAtOrganization >= 1
    ? `${yearsAtOrganization} ${yearsAtOrganization === 1 ? "year" : "years"} with the team`
    : null;

  if (!(hasImage || hasName || hasRole || hasShortBio)) return null;

  return (
    <article
      className={cn(
        "grid min-w-0 overflow-hidden rounded-sm border border-current/15",
        hasImage && "grid-cols-[minmax(0,1fr)_minmax(0,2fr)]",
      )}
      data-sanity={referenceDataAttribute}
    >
      {hasImage && member.image ? (
        <div
          className="relative min-h-48 bg-muted"
          data-sanity={memberDataAttribute?.(member._id, "image")}
        >
          <Image
            alt={stegaClean(member.image.alt) || ""}
            blurDataURL={member.image.asset?.metadata?.lqip || undefined}
            className="object-cover"
            fill
            loading="lazy"
            placeholder={member.image.asset?.metadata?.lqip ? "blur" : undefined}
            sizes="(min-width: 1280px) 128px, (min-width: 768px) 192px, 33vw"
            src={urlFor(member.image).width(320).height(480).url()}
          />
        </div>
      ) : null}
      <div className="grid min-w-0 content-start gap-3 p-4">
        {hasName || hasRole ? (
          <div className="grid gap-1">
            {hasName ? (
              <h3
                className="text-balance wrap-break-word font-display text-title text-foreground"
                data-sanity={memberDataAttribute?.(member._id, "name")}
              >
                {member.name}
              </h3>
            ) : null}
            {hasRole ? (
              <p
                className="wrap-break-word text-sm leading-snug text-muted-foreground"
                data-sanity={memberDataAttribute?.(member._id, "role")}
              >
                {member.role}
              </p>
            ) : null}
          </div>
        ) : null}
        {experience ? (
          <p
            className="text-sm leading-snug font-medium text-foreground"
            data-sanity={memberDataAttribute?.(member._id, "yearsAtOrganization")}
          >
            {experience}
          </p>
        ) : null}
        {hasShortBio ? (
          <p
            className="text-pretty wrap-break-word text-sm leading-relaxed text-muted-foreground"
            data-sanity={memberDataAttribute?.(member._id, "shortBio")}
          >
            {member.shortBio}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export default function TeamMembers({
  _key,
  background,
  dataAttribute,
  eyebrow,
  memberDataAttribute,
  members,
  presentation,
  richText,
  title,
}: TeamMembersProps) {
  const resolvedMembers =
    members?.filter(
      (
        member,
      ): member is TeamMemberReference & { document: TeamMemberDocument } =>
        Boolean(member.document),
    ) ?? [];

  if (!resolvedMembers.length) return null;

  const displayEyebrow = stegaClean(eyebrow)?.trim();
  const displayTitle = stegaClean(title)?.trim();
  const isRoster = stegaClean(presentation) === "roster";
  const titleId = _key
    ? `team-members-${stegaClean(_key)}-title`
    : undefined;

  return (
    <section
      aria-labelledby={displayTitle ? titleId : undefined}
      className={cn(
        "py-section",
        stegaClean(background) === "green"
          ? "field-green"
          : stegaClean(background) === "cream"
            ? "field-cream"
            : "field-white",
      )}
      data-sanity={dataAttribute?.("background")}
      id="team"
    >
      <div className="container-content grid gap-8 sm:gap-10">
        <header className="mx-auto grid w-full max-w-3xl justify-items-center gap-5 text-center">
          {displayEyebrow || displayTitle ? (
            <div>
              {displayEyebrow ? (
                <p
                  className="mb-3.5 text-eyebrow text-primary"
                  data-sanity={dataAttribute?.("eyebrow")}
                >
                  {eyebrow}
                </p>
              ) : null}
              {displayTitle ? (
                <h2
                  className="text-balance font-display text-headline text-foreground"
                  data-sanity={dataAttribute?.("title")}
                  id={titleId}
                >
                  {title}
                </h2>
              ) : null}
            </div>
          ) : null}
          {richText?.length ? (
            <div
              className="text-pretty text-base/relaxed text-muted-foreground sm:text-lg/relaxed [&_p]:!my-0"
              data-sanity={dataAttribute?.("richText")}
            >
              <PortableTextRenderer value={richText} />
            </div>
          ) : null}
        </header>
        <div
          className={cn(
            "grid",
            isRoster
              ? "grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
              : "gap-16",
          )}
          data-sanity={dataAttribute?.("members")}
        >
          {resolvedMembers.map((member, index) => {
            const memberPath = member._key
              ? `members[_key=="${member._key}"]`
              : `members[${index}]`;

            return isRoster ? (
              <TeamMemberRosterCard
                key={member._key ?? member.document._id}
                member={member.document}
                memberDataAttribute={memberDataAttribute}
                referenceDataAttribute={dataAttribute?.(memberPath)}
              />
            ) : (
              <TeamMemberProfile
                index={index}
                key={member._key ?? member.document._id}
                member={member.document}
                memberDataAttribute={memberDataAttribute}
                referenceDataAttribute={dataAttribute?.(memberPath)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
