import Octicons from "@expo/vector-icons/Octicons";
import { Icon } from "@expo/vector-icons/build/createIconSet";
import { useCallback, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { amountSeparator, getAmountText } from "./Amount";
import { color, ss } from "./style";

export type OctName = typeof Octicons extends Icon<infer G, any> ? G : never;

export function InputBig({
  value,
  onChange,
  placeholder,
  icon,
  center,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: OctName;
  center?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const onFocus = useCallback(() => setIsFocused(true), []);
  const onBlur = useCallback(() => setIsFocused(false), []);

  return (
    <View style={isFocused ? styles.inputRowFocused : styles.inputRow}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={color.gray}
        value={value}
        onChangeText={onChange}
        style={center ? styles.inputCentered : styles.input}
        multiline
        numberOfLines={1}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        keyboardType="visible-password"
        {...{ onFocus, onBlur }}
      />
      {icon && <Octicons name={icon} size={16} color="gray" />}
    </View>
  );
}

export function AmountInput({
  dollars,
  onChange,
  onSubmitEditing,
  innerRef,
  autoFocus,
}: {
  dollars: number;
  onChange: (dollars: number) => void;
  onSubmitEditing?: (dollars: number) => void;
  innerRef?: React.RefObject<TextInput>;
  autoFocus?: boolean;
}) {
  if (dollars < 0) throw new Error("AmountPicker value can't be negative");

  const fmt = (dollars: number) =>
    getAmountText({ dollars: dollars.toFixed(2) as `${number}`, symbol: "" });

  const [strVal, setStrVal] = useState(dollars <= 0 ? "" : fmt(dollars));

  // On end editing, round value to 2 decimal places
  const onEndEditing = (e: { nativeEvent: { text: string } }) => {
    const value = e.nativeEvent.text;
    let newVal = parseLocalFloat(value);
    if (!(newVal >= 0)) {
      newVal = 0;
    }
    const newStrVal = fmt(newVal);
    setStrVal(newVal > 0 ? newStrVal : "");

    const truncated = parseLocalFloat(newStrVal);
    onChange(truncated);
    if (onSubmitEditing) onSubmitEditing(truncated);
  };

  const change = useCallback((text: string) => {
    setStrVal(text);
    const newVal = parseLocalFloat(text);

    // Handle invalid or entry, NaN etc
    if (!(newVal > 0)) {
      onChange(0);
      return;
    }

    // Update number
    onChange(newVal);
    const nEnteredDecimals = (text.split(amountSeparator)[1] || "").length;
    if (nEnteredDecimals === 2 && text.length > strVal.length) {
      // User just typed in the full amount, down to the cent. Submit.
      if (innerRef?.current) innerRef.current.blur();
      if (onSubmitEditing) onSubmitEditing(newVal);
    }
  }, []);

  const onSubmit = useCallback(() => {
    if (onSubmitEditing) onSubmitEditing(dollars);
  }, [dollars]);

  return (
    <TextInput
      ref={innerRef}
      style={styles.amountInput}
      keyboardType="numeric"
      placeholder={`0${amountSeparator}00`}
      placeholderTextColor={color.gray}
      numberOfLines={1}
      autoFocus={autoFocus == null ? true : autoFocus}
      value={strVal}
      selectTextOnFocus
      onChangeText={change}
      onSubmitEditing={onSubmit}
      returnKeyType="done"
      onEndEditing={onEndEditing}
    />
  );
}

const inputRow = {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  backgroundColor: color.bg.lightGray,
  borderRadius: 8,
  paddingHorizontal: 16,
  paddingVertical: 12,
} as const;

const input = {
  ...ss.text.body,
  flexGrow: 1,
  paddingTop: 0,
  paddingVertical: 0,
} as const;

const styles = StyleSheet.create({
  inputRow,
  inputRowFocused: {
    ...inputRow,
    backgroundColor: color.bg.blue,
  },
  input,
  inputCentered: {
    ...input,
    textAlign: "center",
  },
  amountInput: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    borderBottomColor: color.gray,
    borderBottomWidth: 1,
  },
});

// Parse both 1.23 and 1,23
function parseLocalFloat(str?: string) {
  if (str == null) return 0;
  return parseFloat(str.replace(",", "."));
}
