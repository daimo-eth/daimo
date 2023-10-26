import { useCallback, useState } from "react";
import {
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  TextInputEndEditingEventData,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { getAmountText } from "./Amount";
import Spacer from "./Spacer";
import { color, ss } from "./style";
import { TextCenter, TextLight } from "./text";
import { useAccount } from "../../model/account";

export function AmountChooser({
  dollars,
  onSetDollars,
  showAmountAvailable,
  disabled,
  innerRef,
}: {
  dollars: number;
  onSetDollars: (dollars: number) => void;
  showAmountAvailable: boolean;
  disabled?: boolean;
  innerRef?: React.RefObject<TextInput>;
}) {
  // Show how much we have available
  const [account] = useAccount();
  if (account == null) return null;
  const dollarStr = getAmountText({ amount: account.lastBalance });

  return (
    <View style={ss.container.padH16}>
      <AmountInput
        dollars={dollars}
        onChange={onSetDollars}
        disabled={disabled}
        innerRef={innerRef}
      />
      <Spacer h={8} />
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
}: {
  dollars: number;
  onChange: (dollars: number) => void;
  innerRef?: React.RefObject<TextInput>;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  if (dollars < 0) throw new Error("AmountPicker value can't be negative");

  const fmt = (dollars: number) => getAmountText({ dollars, symbol: "" });

  const [strVal, setStrVal] = useState(dollars <= 0 ? "" : fmt(dollars));

  // While typing, show whatever the user is typing
  const change = useCallback((text: string) => {
    if (disabled) return;

    setStrVal(text);
    const newVal = parseLocalFloat(text);

    // Handle empty entry, negative numbers, NaN etc
    if (!(newVal > 0)) {
      onChange(0);
      return;
    }

    // Update number
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

  const focus = useCallback(() => innerRef?.current?.focus(), [innerRef]);

  return (
    <TouchableWithoutFeedback onPress={focus}>
      <View style={styles.amountInputWrap}>
        <Text style={styles.amountDollar}>$</Text>
        <TextInput
          ref={innerRef}
          style={styles.amountInput}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={color.grayMid}
          numberOfLines={1}
          focusable={!disabled}
          editable={!disabled}
          selectTextOnFocus
          autoFocus={autoFocus ?? true}
          value={strVal}
          onChangeText={change}
          onEndEditing={onBlur} /* called on blur, works on Android */
        />
      </View>
    </TouchableWithoutFeedback>
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
  if (str == null) return 0;
  return parseFloat(str.replace(",", "."));
}
