import { View } from "react-native";

export default function Spacer({
  w,
  h,
}: {
  w?: 8 | 16 | 32 | 64;
  h?: 8 | 16 | 32 | 64 | 128;
}) {
  return <View style={{ width: w, height: h }} />;
}
