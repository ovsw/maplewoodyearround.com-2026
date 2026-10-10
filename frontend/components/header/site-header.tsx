"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
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
  const [reveal, setReveal] = useState<CSSProperties>();
  const triggerRef = useRef<HTMLButtonElement>(null);
  // The menu opens as a circle growing from the Menu button and closes back
  // into it. The dialog's Close button sits in the same place, so one origin
  // serves both ways. Measure on every change: scroll and resize move it.
  const setMenuOpen = (open: boolean) => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );
      setReveal({
        "--menu-origin": `${x}px ${y}px`,
        "--menu-radius": `${radius}px`,
      } as CSSProperties);
    }
    setMobileMenuOpen(open);
  };
  const close = () => setMenuOpen(false);
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
    <Dialog.Root open={mobileMenuOpen} onOpenChange={setMenuOpen}>
      <SiteHeaderShell theme={theme} forceVisible={mobileMenuOpen}>
        <div className={styles.bar}>
          {brand}
          <div className={styles.controls}>
            <div className={styles.actions}>{actions}</div>
            <Dialog.Trigger
              className={styles.toggle}
              aria-label="Open menu"
              ref={triggerRef}
            >
              <Menu aria-hidden="true" />
              <span>Menu</span>
            </Dialog.Trigger>
          </div>
        </div>
      </SiteHeaderShell>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          className={styles.dialog}
          aria-describedby={undefined}
          style={reveal}
        >
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
                        <HeaderLink
                          link={item.link}
                          onClick={close}
                          className={
                            item.icon || item.description
                              ? styles.childLink
                              : undefined
                          }
                        >
                          {item.icon && (
                            <span className={styles.childIcon}>
                              <NavigationIcon icon={item.icon} />
                            </span>
                          )}
                          <span>
                            {item.label}
                            {item.description && (
                              <span className={styles.childDescription}>
                                {item.description}
                              </span>
                            )}
                          </span>
                        </HeaderLink>
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
