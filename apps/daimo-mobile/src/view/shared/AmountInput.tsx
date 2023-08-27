import { dollarsToAmount } from "@daimo/common";
import { ReactNode, useCallback, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { TitleAmount, amountSeparator, getAmountText } from "./Amount";
import { ButtonSmall } from "./Button";
import Spacer from "./Spacer";
import { color, ss } from "./style";
import { TextLight, TextCenter } from "./text";
import { useAccount } from "../../model/account";
import { CancelHeader } from "../screen/send/CancelHeader";

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

  const fmt = (dollars: number) => getAmountText({ dollars, symbol: "" });

  const [strVal, setStrVal] = useState(dollars <= 0 ? "" : fmt(dollars));

  // On end editing, round value to 2 decimal places
  const onEndEditing = (e: { nativeEvent: { text: string } }) => {
    const value = e.nativeEvent.text;
    console.log(`[INPUT] onEndEditing ${value}`);

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
    console.log(`[INPUT] onSubmitEditing ${dollars}`);
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

export function SendAmountChooser({
  actionDesc,
  onCancel,
  dollars,
  onSetDollars,
}: {
  actionDesc: ReactNode;
  onCancel?: () => void;
  dollars: number;
  onSetDollars?: (dollars: number) => void;
}) {
  // Temporary dollar amount while typing
  const [d, setD] = useState(0);
  const submit =
    onSetDollars &&
    ((newD: number) => {
      onSetDollars(newD);
      setD(0);
    });
  const clearDollars = onSetDollars && (() => onSetDollars(0));

  // Show how much we have available
  const [account] = useAccount();
  if (account == null) return null;
  const dollarStr = getAmountText({ amount: account.lastBalance });

  return (
    <>
      <Spacer h={64} />
      <CancelHeader hide={onCancel}>{actionDesc}</CancelHeader>
      <Spacer h={32} />
      {dollars === 0 && (
        <View style={ss.container.padH16}>
          <AmountInput dollars={d} onChange={setD} onSubmitEditing={submit} />
          <Spacer h={16} />
          <TextLight>
            <TextCenter>{dollarStr} available</TextCenter>
          </TextLight>
        </View>
      )}
      {dollars > 0 && (
        <ButtonSmall onPress={clearDollars}>
          <TextCenter>
            <TitleAmount amount={dollarsToAmount(dollars)} />
          </TextCenter>
        </ButtonSmall>
      )}
    </>
  );
}

const styles = StyleSheet.create({
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
