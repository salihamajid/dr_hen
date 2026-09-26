import type { Metadata } from "next";
import { getT, type I18nKey } from "./index";
import { getRequestLang } from "./server";

/** `export const generateMetadata = () => localizedTitle("title.flocks");` gives a page a tab title in the viewer's language. */
export async function localizedTitle(key: I18nKey): Promise<Metadata> {
  return { title: getT(await getRequestLang())(key) };
}
