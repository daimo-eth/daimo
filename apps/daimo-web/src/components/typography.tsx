import Link from "next/link";
import { HTMLAttributeAnchorTarget } from "react";

export function SectionH3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[1.75rem] font-semibold text-midnight leading-none">
      {children}
    </h3>
  );
}

export function LinkBold14({
  href,
  target,
  children,
}: {
  href: string;
  target?: HTMLAttributeAnchorTarget;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} target={target}>
      <TextBold14>{children}</TextBold14>
    </Link>
  );
}

export function TextBold14({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold text-midnight">{children}</p>;
}
