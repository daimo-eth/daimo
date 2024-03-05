export function Laptop(
  props: React.ComponentPropsWithoutRef<"svg"> & { color?: string }
) {
  const color = props.color || "black";
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <rect
        x="48"
        y="96"
        width="416"
        height="304"
        rx="32.14"
        ry="32.14"
        fill="none"
        stroke={color}
        stroke-linejoin="round"
        stroke-width="32"
      />
      <path
        stroke={color}
        stroke-linecap="round"
        stroke-miterlimit="10"
        stroke-width="32"
        d="M16 416h480"
      />
    </svg>
  );
}
