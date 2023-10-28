import CheckBox from "@react-native-community/checkbox";
import { StyleSheet } from "react-native";

export function Check({
  value,
  setValue,
}: {
  value: boolean;
  setValue: (val: boolean) => void;
}) {
  return (
    <CheckBox
      boxType="square"
      style={styles.checkbox}
      animationDuration={0.05}
      value={value}
      onValueChange={setValue}
    />
  );
}

const styles = StyleSheet.create({
  checkbox: {
    width: 16,
    height: 16,
  },
});
