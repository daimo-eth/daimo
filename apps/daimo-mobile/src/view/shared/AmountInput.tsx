import Octicons from "@expo/vector-icons/Octicons";
import { Picker } from "@react-native-picker/picker";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputEndEditingEventData,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { amountSeparator, getAmountText } from "./Amount";
import Spacer from "./Spacer";
import { color, ss } from "./style";
import {
  DaimoText,
  MAX_FONT_SIZE_MULTIPLIER,
  TextCenter,
  TextLight,
} from "./text";
import { useAccount } from "../../logic/accountManager";

// Input components allows entry in range $0.01 to $99,999.99
const MAX_DOLLAR_INPUT_EXCLUSIVE = 100_000;

export function AmountChooser({
  dollars,
  onSetDollars,
  showAmountAvailable,
  autoFocus,
  disabled,
  innerRef,
  onFocus,
}: {
  dollars: number;
  onSetDollars: (dollars: number) => void;
  showAmountAvailable: boolean;
  autoFocus: boolean;
  disabled?: boolean;
  innerRef?: React.RefObject<TextInput>;
  onFocus?: () => void;
}) {
  // Show how much we have available
  const account = useAccount();

  if (account == null) return null;
  const dollarStr = getAmountText({ amount: account.lastBalance });

  return (
    <View style={ss.container.padH16}>
      <AmountInput
        dollars={dollars}
        onChange={onSetDollars}
        disabled={disabled}
        innerRef={innerRef}
        autoFocus={autoFocus}
        onFocus={onFocus}
      />
      <Spacer h={4} />
      <TextCenter>
        <TextLight>
          {showAmountAvailable ? `${dollarStr} available` : " "}
        </TextLight>
      </TextCenter>
    </View>
  );
}

function AmountInput({
  dollars,
  onChange,
  innerRef,
  autoFocus,
  disabled,
  onFocus,
}: {
  dollars: number;
  onChange: (dollars: number) => void;
  innerRef?: React.RefObject<TextInput>;
  autoFocus?: boolean;
  disabled?: boolean;
  onFocus?: () => void;
}) {
  if (dollars < 0) throw new Error("AmountPicker value can't be negative");

  const fmt = (dollars: number) => getAmountText({ dollars, symbol: "" });

  const [strVal, setStrVal] = useState(dollars <= 0 ? "" : fmt(dollars));

  // While typing, show whatever the user is typing
  const change = useCallback((text: string) => {
    if (disabled) return;

    // Haptic (tactile) feedback on each keypress
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Validate. Handle negative numbers, NaN, out of range.
    const looksValid = /^(|0|(0?[.,]\d*)|([1-9]\d*[.,]?\d*))$/.test(text);
    const newVal = parseLocalFloat(text);
    if (!looksValid || !(newVal >= 0) || newVal >= MAX_DOLLAR_INPUT_EXCLUSIVE) {
      // reject input
      return;
    }

    // Max two decimals: if necessary, modify entry
    const parts = text.split(/[.,]/);
    if (parts.length >= 2) {
      const roundedStr = `${parts[0]}${amountSeparator}${parts[1].slice(0, 2)}`;
      const roundedVal = parseLocalFloat(`${parts[0]}.${parts[1].slice(0, 2)}`);
      setStrVal(roundedStr);
      onChange(roundedVal);
      return;
    }

    // Accept entry as-is
    setStrVal(text);
    onChange(newVal);
  }, []);

  // Once we're done, round value to 2 decimal places
  const onBlur = (e: NativeSyntheticEvent<TextInputEndEditingEventData>) => {
    const value = e.nativeEvent.text;
    console.log(`[INPUT] onBlur finalizing ${value}`);

    let newVal = parseLocalFloat(value);
    if (!(newVal >= 0)) {
      newVal = 0;
    }
    const newStrVal = fmt(newVal);
    setStrVal(newVal > 0 ? newStrVal : "");

    const truncated = parseLocalFloat(newStrVal);
    onChange(truncated);
  };

  const otherRef = useRef<TextInput>(null);
  const ref = innerRef || otherRef;

  // Controlled component, but with state to allow typing "0", "0.", etc.
  useEffect(() => {
    if (ref.current?.isFocused()) return;
    setStrVal(dollars <= 0 ? "" : fmt(dollars));
  }, [dollars]);

  const focus = useCallback(() => {
    ref.current?.focus();
    if (onFocus) onFocus();
  }, [ref, onFocus]);

  // Currency picker
  const [currency, setCurrency] = useState<string>("USD");
  const [picking, setPicking] = useState(false);
  const pickCurrency = useCallback(() => {
    setPicking(!picking);
  }, []);

  return (
    <TouchableWithoutFeedback onPress={focus} accessible={false}>
      <View style={styles.amountInputWrap}>
        {picking && (
          <CurrencyPicker currency={currency} onSetCurrency={setCurrency} />
        )}
        <Pressable onPress={pickCurrency} style={{ paddingBottom: 20 }}>
          <Octicons name="chevron-down" size={24} color={color.grayMid} />
        </Pressable>
        <DaimoText style={styles.amountDollar}>$</DaimoText>
        <TextInput
          ref={ref}
          style={styles.amountInput}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={color.grayMid}
          numberOfLines={1}
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          focusable={!disabled}
          editable={!disabled}
          selectTextOnFocus
          autoFocus={autoFocus}
          value={strVal}
          onChangeText={change}
          onEndEditing={onBlur} /* called on blur, works on Android */
          onTouchEnd={focus}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const currencies = [
  { label: "$ USD", value: "USD" },
  { label: "€ EUR", value: "EUR" },
  { label: "£ GBP", value: "GBP" },
  { label: "¥ JPY", value: "JPY" },
  { label: "₩ KRW", value: "KRW" },
  { label: "₪ TRY", value: "TRY" },
  // CHF, AUD, CAD, MXN, ARS below
  { label: "Fr. CHF", value: "CHF" },
  { label: "$ AUD", value: "AUD" },
  { label: "$ CAD", value: "CAD" },
  { label: "$ MXN", value: "MXN" },
  { label: "$ ARS", value: "ARS" },
];

function CurrencyPicker({
  currency,
  onSetCurrency,
}: {
  currency: string;
  onSetCurrency: (currency: string) => void;
}) {
  const choose = (val: any) => {
    if (val == null) return;
    onSetCurrency(val);
  };

  return (
    <View style={{ position: "absolute", top: 0, right: 0 }}>
      <Picker selectedValue={currency} onValueChange={choose}>
        {currencies.map((c) => (
          <Picker.Item key={c.value} label={c.label} value={c.value} />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  amountInputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  amountDollar: {
    flexGrow: 1,
    fontSize: 56,
    fontWeight: "600",
    paddingBottom: 2,
    color: color.midnight,
    textAlign: "right",
  },
  amountInput: {
    flexGrow: 1,
    fontSize: 64,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    color: color.midnight,
  },
});

// Parse both 1.23 and 1,23
function parseLocalFloat(str?: string) {
  if (str == null || ["", ".", ","].includes(str)) return 0;
  return parseFloat(str.replace(",", "."));
}
