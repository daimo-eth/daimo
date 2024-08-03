import { HomePage } from "./HomePage";
import { getReqLang } from "../i18n/server";

export default function HomePageWrap() {
  return <HomePage lang={getReqLang()} />;
}
