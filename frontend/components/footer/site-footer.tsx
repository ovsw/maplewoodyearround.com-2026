import Image from "next/image";
import { Fragment } from "react";
import { siteName } from "@/lib/site-name";
import { FooterLink } from "./footer-link";
import { FooterIcon, socialIconFor } from "./icons";
import { Newsletter } from "../newsletter/newsletter";
import type { FooterModel, FooterLogoModel } from "./model";
import styles from "./maplewood-footer.module.css";

function Logo({ logo }: { logo: FooterLogoModel }) {
  const picture = (
    <Image
      alt={logo.alt}
      src={logo.image.src}
      width={logo.image.width}
      height={logo.image.height}
      sizes="128px"
      className={styles.logo}
    />
  );
  return logo.link ? (
    <FooterLink link={logo.link}>{picture}</FooterLink>
  ) : (
    picture
  );
}

export function SiteFooter({
  dataAttribute,
  model,
}: {
  dataAttribute?: (path: string) => string | undefined;
  model: FooterModel;
}) {
  const contact = {
    phone: model.contact?.phone?.trim(),
    email: model.contact?.email?.trim(),
    fax: model.contact?.fax?.trim(),
    addressLines: model.contact?.addressLines
      ?.map((line) => line.trim())
      .filter(Boolean),
  };
  const hasContact = Boolean(
    contact.phone ||
    contact.email ||
    contact.fax ||
    contact.addressLines?.length,
  );
  return (
    <footer className={styles.footer} data-footer-state="ready">
      <div className={styles.inner}>
        <div className={styles.top}>
          <section
            className={styles.contact}
            aria-label={`${siteName} contact information`}
          >
            <p className={styles.business}>
              Maplewood Country Day Camp and Enrichment Center Inc.
            </p>
            {hasContact ? (
              <address>
                <p>
                  {contact.phone && (
                    <a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}>
                      {contact.phone}
                    </a>
                  )}
                  {contact.phone && contact.email && " – "}
                  {contact.email && (
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  )}
                </p>
                {contact.fax && <p>Fax: {contact.fax}</p>}
                {contact.addressLines?.length ? (
                  <p className={styles.address}>
                    {contact.addressLines.map((line, index) => (
                      <Fragment key={index}>
                        {index > 0 && <br />}
                        {line}
                      </Fragment>
                    ))}
                  </p>
                ) : null}
              </address>
            ) : (
              <ul>
                {model.contactLinks.map(({ link }) => (
                  <li key={link.key}>
                    <FooterLink link={link}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            )}
            <div className={styles.mobileLogos}>
              {model.logos.map((logo) => (
                <Logo key={logo.key} logo={logo} />
              ))}
            </div>
          </section>
          <div className={styles.columns}>
            {model.columns.map((column) => (
              <section
                key={column.key}
                aria-labelledby={`footer-${column.key}`}
              >
                <h2 id={`footer-${column.key}`}>{column.heading}</h2>
                <ul>
                  {column.links.map((link) => {
                    const icon = socialIconFor(link.href);
                    return (
                      <li key={link.key}>
                        <FooterLink link={link}>
                          {icon && (
                            <FooterIcon
                              name={icon}
                              className={styles.socialIcon}
                            />
                          )}
                          {link.label}
                        </FooterLink>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>
        {model.actions.length > 0 && (
          <nav aria-label="Footer actions" className={styles.actions}>
            {model.actions.map((action) => (
              <FooterLink key={action.key} link={action} />
            ))}
          </nav>
        )}
        <Newsletter
          copy={
            model.newsletter ?? {
              description:
                "Join our newsletter to stay in touch. No spam, ever.",
            }
          }
        />
        <p className={styles.wordmark} aria-hidden="true">
          Maplewood
        </p>
        <div className={styles.legal}>
          <div className={styles.desktopLogos}>
            {model.logos.map((logo) => (
              <Logo key={logo.key} logo={logo} />
            ))}
          </div>
          <p>
            ©{" "}
            <span data-sanity={dataAttribute?.("copyrightStartYear")}>
              {model.copyrightYears}
            </span>{" "}
            <span data-sanity={dataAttribute?.("copyrightOwner")}>
              {model.copyrightOwner}
            </span>
            <br />
            All rights reserved.
          </p>
          <nav aria-label="Legal">
            <ul>
              {model.legalLinks.map((link) => (
                <li key={link.key}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
