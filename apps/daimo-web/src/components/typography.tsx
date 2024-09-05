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

export function LinkSemiBold({
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
      <TextSemiBold>{children}</TextSemiBold>
    </Link>
  );
}

export function TextSemiBold({
  children,
  textColor,
}: {
  children: React.ReactNode;
  textColor?: string;
}) {
  return (
    <p
      className={`text-[16px] tracking-[1px] leading-[20.8px] font-semibold ${
        textColor || "text-white"
      }`}
    >
      {children}
    </p>
  );
}

export function TextBold({
  children,
  textColor,
}: {
  children: React.ReactNode;
  textColor?: string;
}) {
  return (
    <p
      className={`text-[16px] tracking-none leading-[20.8px] font-bold ${
        textColor || "text-white"
      }`}
    >
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
