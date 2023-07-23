export function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="text-2xl font-bold">{children}</h1>;
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold">{children}</h2>;
}

export function TextBody({ children }: { children: React.ReactNode }) {
  return <p className="text-base">{children}</p>;
}
