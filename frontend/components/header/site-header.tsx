"use client";

import Link from "next/link";
import { useState } from "react";
import { Dialog } from "radix-ui";
import { Menu, X, MessagesSquare, PanelsTopLeft } from "lucide-react";
import { HeaderBrand } from "./brand";
import { HeaderLink } from "./header-link";
import { NavigationIcon } from "./navigation-icon";
import { FooterIcon, socialIconFor } from "../footer/icons";
import type { HeaderModel } from "./model";
import { SiteHeaderShell } from "./site-header-shell";
import type { HeaderTheme } from "./theme";
import styles from "./maplewood-header.module.css";

// Port of legacy-mdc/nav/new-nav.jsx's controlled dialog menu, using the
// installed Radix dialog instead of adding Headless UI. Maplewood layout and
// content order come from legacy-mdc/webflow-html/source-nav.html and live HTML.
export function Header({
  model,
  theme = "light",
}: {
  model: HeaderModel;
  theme?: HeaderTheme;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const close = () => setMobileMenuOpen(false);
  const featured = model.navigation.items.filter(
    (item) => item.kind === "link",
  );
  const groups = model.navigation.items.filter((item) => item.kind === "group");
  const brand = (
    <Link
      aria-label={`${model.brand.label} home page`}
      className={styles.brand}
      href="/"
      onClick={close}
    >
      <HeaderBrand brand={model.brand} />
    </Link>
  );
  const actions = model.navigation.actions.map((action, index) => (
    <HeaderLink
      className={styles.action}
      key={action.key}
      link={action.link}
      onClick={close}
    >
      {index === 0 ? (
        <MessagesSquare aria-hidden="true" />
      ) : (
        <PanelsTopLeft aria-hidden="true" />
      )}
      {action.link.label}
    </HeaderLink>
  ));
  return (
    <Dialog.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SiteHeaderShell theme={theme} forceVisible={mobileMenuOpen}>
        <div className={styles.bar}>
          {brand}
          <div className={styles.controls}>
            <div className={styles.actions}>{actions}</div>
            <Dialog.Trigger className={styles.toggle} aria-label="Open menu">
              <Menu aria-hidden="true" />
              <span>Menu</span>
            </Dialog.Trigger>
          </div>
        </div>
      </SiteHeaderShell>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className={styles.dialog} aria-describedby={undefined}>
          <Dialog.Title className="sr-only">Main navigation</Dialog.Title>
          <div className={styles.bar}>
            {brand}
            <div className={styles.controls}>
              <div className={styles.actions}>{actions}</div>
              <Dialog.Close className={styles.toggle} aria-label="Close menu">
                <X aria-hidden="true" />
                <span>Close</span>
              </Dialog.Close>
            </div>
          </div>
          <nav className={styles.menu} aria-label="Main navigation">
            <div className={styles.featured}>
              <div className={styles.mobileActions}>{actions}</div>
              {featured.map((item) => (
                <HeaderLink
                  key={item.key}
                  className={styles.featuredLink}
                  accent={item.accent}
                  link={item.link}
                  onClick={close}
                >
                  {item.icon && (
                    <span className={styles.featuredIcon}>
                      <NavigationIcon icon={item.icon} />
                    </span>
                  )}
                  <span>{item.label}</span>
                </HeaderLink>
              ))}
            </div>
            <div className={styles.groups}>
              {groups.map((group) => (
                <section className={styles.group} key={group.key}>
                  <h2>
                    {group.link ? (
                      <HeaderLink link={group.link} onClick={close} />
                    ) : (
                      group.label
                    )}
                  </h2>
                  <ul>
                    {group.links.map((item) => (
                      <li key={item.key}>
                        <HeaderLink link={item.link} onClick={close} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <div className={styles.contact}>
              {model.contact?.phone && (
                <p>
                  <a href={`tel:${model.contact.phone.replace(/[^+\d]/g, "")}`}>
                    {model.contact.phone}
                  </a>
                </p>
              )}
              {model.contact?.email && (
                <p>
                  <a href={`mailto:${model.contact.email}`}>
                    {model.contact.email}
                  </a>
                </p>
              )}
              {model.contact?.menuAddress ? (
                <p>{model.contact.menuAddress}</p>
              ) : model.contact?.addressLines?.length ? (
                <p>{model.contact.addressLines.join(", ")}</p>
              ) : null}
              <div className={styles.socials}>
                {model.socialLinks?.map((link) => {
                  const icon = socialIconFor(link.href);
                  return (
                    <HeaderLink key={link.href} link={link} onClick={close}>
                      {icon ? (
                        <>
                          <FooterIcon name={icon} />
                          <span className="sr-only">{link.label}</span>
                        </>
                      ) : (
                        link.label
                      )}
                    </HeaderLink>
                  );
                })}
              </div>
            </div>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
