import { useMemo } from "react";
import { View } from "react-native";

export default function Spacer({
  w,
  h,
}: {
  w?: 8 | 16 | 32 | 64;
  h?: 8 | 16 | 32 | 64 | 128;
}) {
  const style = useMemo(() => ({ width: w, height: h }), [w, h]);
  return <View style={style} />;
}
