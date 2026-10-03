import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { FooterLink } from "./footer-link";
import { FooterIcon, socialIconFor } from "./icons";
import type {
  FooterColumnModel,
  FooterLinkModel,
  FooterModel,
} from "./model";

const contactIcons = { email: Mail, phone: Phone, pin: MapPin } as const;

function LinkList({ links }: { links: FooterLinkModel[] }) {
  return (
    <ul className="flex flex-col items-start gap-[13px]">
      {links.map((link) => {
        const socialIcon = socialIconFor(link.href);

        return (
          <li key={link.key}>
            <FooterLink link={link} dataSanity={undefined}>
              <span className="flex items-center gap-2.5 text-[14.5px] text-foreground/75 transition-colors duration-200 hover:text-link">
                {socialIcon ? (
                  <FooterIcon className="size-4 shrink-0" name={socialIcon} />
                ) : null}
                {link.label}
              </span>
            </FooterLink>
          </li>
        );
      })}
    </ul>
  );
}

function FooterColumn({ column }: { column: FooterColumnModel }) {
  const headingId = `footer-column-${column.key}`;
  return (
    <section aria-labelledby={headingId}>
      <h2
        className="mb-[19px] font-display text-[15px] font-bold tracking-[0.02em] text-foreground"
        id={headingId}
      >
        {column.heading}
      </h2>
      <LinkList links={column.links} />
    </section>
  );
}

function FooterAction({
  link,
  primary,
}: {
  link: FooterLinkModel;
  primary: boolean;
}) {
  return (
    <FooterLink link={link}>
      <span
        className={
          primary
            ? "inline-flex items-center rounded-pill bg-primary px-[30px] py-4 font-bold text-primary-foreground transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-primary-hover motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            : "inline-flex items-center rounded-pill border-[1.5px] border-foreground/50 px-[30px] py-[15.5px] font-semibold text-foreground transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-foreground/90 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        }
      >
        {link.label}
      </span>
    </FooterLink>
  );
}

export function SiteFooter({
  dataAttribute,
  model,
}: {
  dataAttribute?: (path: string) => string | undefined;
  model: FooterModel;
}) {
  return (
    <footer
      className="relative z-[1] -mt-(--section-overlap) field-night rounded-t-section px-content-x pb-8 pt-16 text-foreground/75 phone:pb-10 phone:pt-[100px]"
      data-footer-state="ready"
    >
      <div className="mx-auto max-w-[1320px]">
        <div className="flex flex-wrap items-end justify-between gap-[34px] pb-[70px]">
          <div>
            <p
              className="text-eyebrow mb-5 text-link"
              data-sanity={dataAttribute?.("eyebrow")}
            >
              {model.eyebrow}
            </p>
            <h2
              className="text-headline font-display text-foreground"
              id="site-footer-heading"
            >
              <span data-sanity={dataAttribute?.("heading")}>{model.heading}</span>
              <br />
              <span
                className="font-accent text-[1.15em] font-semibold text-emphasis"
                data-sanity={dataAttribute?.("accent")}
              >
                {model.accent}
              </span>
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3.5">
            {model.actions.map((action, index) => (
              <FooterAction
                key={action.key}
                link={action}
                primary={index === model.actions.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Below 1280px the contact block takes its own row. The four link
            columns stay together until they pair up below tablet width. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-11 border-y border-border py-[60px] tablet:grid-cols-4 min-[1280px]:grid-cols-[1.5fr_repeat(4,1fr)] min-[1280px]:gap-12">
          <section
            aria-label="Maplewood Year Round contact information"
            className="col-span-full min-[1280px]:col-span-1"
          >
            <div className="mb-[26px] flex items-center gap-3">
              {model.logos.map((logo) => (
                <FooterLink key={logo.key} link={logo.link}>
                  <span className="flex h-[72px] items-center justify-center">
                    <Image
                      alt={logo.alt}
                      className="max-h-[72px] w-auto max-w-[86px] object-contain"
                      data-sanity={dataAttribute?.(
                        `logos[_key==\"${logo.key}\"].image`,
                      )}
                      height={logo.image.height}
                      sizes="86px"
                      src={logo.image.src}
                      width={logo.image.width}
                    />
                  </span>
                </FooterLink>
              ))}
            </div>
            <ul className="grid grid-cols-[20px_1fr] items-start gap-x-3.5 gap-y-3">
              {model.contactLinks.map(({ icon, link }) => {
                const ContactIcon = contactIcons[icon];
                return (
                <li className="contents" key={link.key}>
                  <ContactIcon
                    aria-hidden="true"
                    className="mt-px size-4 text-foreground/55"
                    strokeWidth={1.8}
                  />
                  <FooterLink link={link}>
                    <span className="whitespace-pre-line font-mono text-sm leading-6 tracking-[0.02em] text-foreground/75 transition-colors duration-200 hover:text-link">
                      <span className="sr-only">
                        {icon === "pin"
                          ? "Address: "
                          : icon === "phone"
                            ? "Phone: "
                            : "Email: "}
                      </span>
                      {link.label}
                    </span>
                  </FooterLink>
                </li>
                );
              })}
            </ul>
          </section>

          {model.columns.map((column) => (
            <FooterColumn column={column} key={column.key} />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-[26px] gap-y-3 pt-7 text-[14px] text-foreground/75">
          <p className="desktop:mr-auto">
            ©
            <span data-sanity={dataAttribute?.("copyrightStartYear")}>
              {model.copyrightYears}
            </span>{" "}
            <span data-sanity={dataAttribute?.("copyrightOwner")}>
              {model.copyrightOwner}
            </span>
          </p>
          {model.legalLinks.map((link) => (
            <FooterLink key={link.key} link={link}>
              <span className="transition-colors duration-200 hover:text-link">
                {link.label}
              </span>
            </FooterLink>
          ))}
        </div>
      </div>
    </footer>
  );
}
