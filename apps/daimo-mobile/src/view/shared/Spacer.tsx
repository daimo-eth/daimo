import { useMemo } from "react";
import { View } from "react-native";

export default function Spacer({ w, h }: { w?: number; h?: number }) {
  const style = useMemo(() => ({ width: w, height: h }), [w, h]);
  return <View style={style} />;
}
