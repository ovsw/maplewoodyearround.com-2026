import Link from "next/link";
import { HeaderBrand } from "./brand";
import { DesktopNav } from "./desktop-nav";
import { HeaderLink } from "./header-link";
import { MobileNav } from "./mobile-nav";
import type { HeaderModel } from "./model";
import { SiteHeaderShell } from "./site-header-shell";
import type { HeaderTheme } from "./theme";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header({
  model,
  theme = "dark",
}: {
  model: HeaderModel;
  theme?: HeaderTheme;
}) {
  const brand = <HeaderBrand brand={model.brand} />;

  return (
    <SiteHeaderShell theme={theme}>
      <div className="container-content flex h-(--header-height) items-center justify-between gap-3 xl:gap-5">
        <Link
          aria-label={`${model.brand.label} home page`}
          className="flex shrink-0 items-center rounded-control font-display text-[15px] font-extrabold tracking-[0.035em] focus-ring"
          href="/"
        >
          {brand}
        </Link>
        <DesktopNav navigation={model.navigation} theme={theme} />
        <div className="hidden shrink-0 items-center gap-4 xl:flex">
          {model.navigation.actions.map((action) => {
            return (
              <HeaderLink
                className={cn(
                  buttonVariants({
                    size: "compact",
                    variant: "outline",
                  }),
                  theme === "dark" &&
                    "border-foreground/45 text-foreground hover:border-foreground/70 hover:bg-foreground/8 hover:text-foreground",
                )}
                key={action.key}
                link={action.link}
              />
            );
          })}
        </div>
        <div className="flex shrink-0 items-center xl:hidden">
          <MobileNav brand={brand} brandLabel={model.brand.label} navigation={model.navigation} theme={theme} />
        </div>
      </div>
    </SiteHeaderShell>
  );
}
