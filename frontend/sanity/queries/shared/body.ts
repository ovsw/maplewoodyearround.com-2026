import { customLinkMarkDefsQuery } from "./custom-link";
import { imageQuery } from "./image";

export const bodyQuery = `
  ...,
  ${customLinkMarkDefsQuery},
  _type == "image" => {
    ${imageQuery}
  }
`;
