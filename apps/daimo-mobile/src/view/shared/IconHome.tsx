import { Path, Svg } from "react-native-svg";

export function IconHome({ color }: { color: string }) {
  return (
    <Svg width="24" height="24" viewBox="-1 -1 25 25" fill="none">
      <Path
        d="M20.3984 14.0781L17.9984 9.91809"
        stroke={color}
        stroke-width="1.36"
        stroke-linecap="round"
      />
      <Path
        d="M21.5996 11.998L16.7996 11.998"
        stroke={color}
        stroke-width="1.36"
        stroke-linecap="round"
      />
      <Path
        d="M20.3984 9.91788L17.9984 14.0779"
        stroke={color}
        stroke-width="1.36"
        stroke-linecap="round"
      />
      <Path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M2.56 -3.05176e-05C1.14615 -3.05176e-05 0 1.14612 0 2.55997V21.44C0 22.8538 1.14615 24 2.56 24H20.16C22.2808 24 24 22.2807 24 20.16V16.9196C24 16.5661 23.7135 16.2796 23.36 16.2796H16.16C14.7461 16.2796 13.6 15.1334 13.6 13.7196V10.2796C13.6 8.86573 14.7461 7.71958 16.16 7.71958H23.36C23.7135 7.71958 24 7.43305 24 7.07958V3.83997C24 1.7192 22.2808 -3.05176e-05 20.16 -3.05176e-05H2.56Z"
        fill={color}
      />
    </Svg>
  );
}
