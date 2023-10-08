import { useMemo } from "react";
import { View } from "react-native";

export default function Spacer({
  w,
  h,
}: {
  w?: 4 | 8 | 12 | 16 | 24 | 32 | 48 | 64;
  h?: 4 | 8 | 12 | 16 | 24 | 32 | 48 | 64 | 128;
}) {
  const style = useMemo(() => ({ width: w, height: h }), [w, h]);
  return <View style={style} />;
}
