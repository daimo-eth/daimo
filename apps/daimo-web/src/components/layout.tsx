import Link from "next/link";
import { HTMLAttributeAnchorTarget } from "react";

export function Spacer({ w, h }: { w?: number; h?: number }) {
  return <div style={{ width: w, height: h }} />;
}
