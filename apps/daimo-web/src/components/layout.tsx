export function Spacer({ w, h }: { w?: number; h?: number }) {
  return (
    <div style={{ width: w && `${w / 16}rem`, height: h && `${h / 16}rem` }} />
  );
}
