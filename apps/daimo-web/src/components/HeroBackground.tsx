export function HeroBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[url('/assets/landing-hero-bg.png')] bg-cover bg-no-repeat">
      {children}
    </div>
  );
}
