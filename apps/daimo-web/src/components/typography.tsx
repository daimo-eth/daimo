import Link from "next/link";
import { HTMLAttributeAnchorTarget } from "react";

export function TextH1({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-[1.75rem] font-semibold text-midnight leading-none">
      {children}
    </h1>
  );
}

export function TextH3Subtle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-semibold text-sm text-grayMid tracking-wider leading-none capitalize">
      {children}
    </h3>
  );
}

export function LinkBold({
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
      <TextBold>{children}</TextBold>
    </Link>
  );
}

export function TextBold({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[16px] tracking-[1%] leading-[20.8px] font-bold text-white">
      {children}
    </p>
  );
}

export function TextError({ children }: { children: React.ReactNode }) {
  return <p className="text-base font-semibold text-danger">{children}</p>;
}

export function TextLight({ children }: { children: React.ReactNode }) {
  return <p className="text-base font-medium text-grayMid">{children}</p>;
}
