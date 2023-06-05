import { Octicons } from "@expo/vector-icons";
import { Icon } from "@expo/vector-icons/build/createIconSet";
import { StyleSheet, TextInput, View } from "react-native";
import { color, ss } from "./style";

export type OctName = typeof Octicons extends Icon<infer G, any> ? G : never;

export function InputBig({
  value,
  onChange,
  placeholder,
  icon,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: OctName;
}) {
  return (
    <View style={styles.inputRow}>
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        style={styles.input}
      />
      {icon && <Octicons name={icon} size={16} color="gray" />}
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: color.bg.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    ...ss.text.body,
    flexGrow: 1,
  },
});
