import { siteName } from "@/lib/site-name";
import { createHeaderBrandModel, createHeaderNavigationModel } from "./model";
import { Header } from "./site-header";
import type { HeaderNavigationModel } from "./model";
import { fetchSanityNavigation, fetchSanitySettings } from "@/sanity/lib/fetch";
import {
  getDynamicFetchOptions,
  type DynamicFetchOptions,
} from "@/sanity/lib/live";
import type { HeaderTheme } from "./theme";
import { getSafeLinkHref } from "@/lib/safe-href";
export { Header } from "./site-header";
export type { HeaderTheme } from "./theme";

function HeaderUnavailable({
  navigation,
  theme,
}: {
  navigation: HeaderNavigationModel;
  theme: HeaderTheme;
}) {
  return (
    <Header
      model={{
        brand: { dark: null, label: siteName, light: null },
        navigation,
      }}
      theme={theme}
    />
  );
}

export async function DynamicHeader({
  theme = "light",
}: {
  theme?: HeaderTheme;
}) {
  const { perspective, stega } = await getDynamicFetchOptions();
  return <CachedHeader perspective={perspective} stega={stega} theme={theme} />;
}

export async function CachedHeader({
  perspective,
  stega,
  theme = "light",
}: DynamicFetchOptions & { theme?: HeaderTheme }) {
  const [settings, rawNavigation] = await Promise.all([
    fetchSanitySettings({ perspective, stega }),
    fetchSanityNavigation({ perspective, stega }),
  ]);
  const navigation = createHeaderNavigationModel(rawNavigation);
  const brand = createHeaderBrandModel(settings);
  if (!brand)
    return <HeaderUnavailable navigation={navigation} theme={theme} />;

  const model = {
    brand,
    navigation,
    contact: settings?.contact,
    socialLinks: (settings?.socialLinks ?? []).flatMap((social) => {
      const href = getSafeLinkHref(social.url);
      const label = social.label?.trim();
      return label && href ? [{ label, href, openInNewTab: true }] : [];
    }),
  };

  return <Header model={model} theme={theme} />;
}
