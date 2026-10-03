import { isSafeIconSvg } from "./safe-icon-svg";

export type NavigationIconModel = {
  name: string;
  svg: string;
};

export function NavigationIcon({
  icon,
}: {
  icon: NavigationIconModel;
}) {
  if (!isSafeIconSvg(icon.svg)) return null;
  return (
    <span
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: icon.svg }}
    />
  );
}
