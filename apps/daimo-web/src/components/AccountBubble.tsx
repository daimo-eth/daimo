export function AccountBubble({ name }: { name: string }) {
  const codePoint = name.codePointAt(0) || "?".charCodeAt(0);
  const first = String.fromCodePoint(codePoint).toUpperCase();

  return (
    <div className="text-2xl w-[35px] h-[35px] rounded-full font-semibold text-primary border border-primary leading-none flex justify-center items-center">
      {first}
    </div>
  );
}
