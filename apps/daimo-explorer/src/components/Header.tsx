import Image from "next/image";

export function Header() {
  return (
    <header className="flex flex-row gap-2 py-4 text-gray-800">
      <Image src="/logo-web.png" alt="Daimo" width={32} height={32} />
      <div className="text-lg font-bold">Daimo Explorer</div>
    </header>
  );
}
