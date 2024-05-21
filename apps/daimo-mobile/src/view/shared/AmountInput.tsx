import { CurrencyExchangeRate, currencyRateUSD } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputEndEditingEventData,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import SelectDropdown from "react-native-select-dropdown";

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
  const [currency, onSetCurrency] =
    useState<CurrencyExchangeRate>(currencyRateUSD);
  const account = useAccount();
  const allCurrencies = [currencyRateUSD, ...(account?.exchangeRates || [])];

  return (
    <TouchableWithoutFeedback onPress={focus} accessible={false}>
      <View style={styles.amountRow}>
        <CurrencyPicker {...{ allCurrencies, currency, onSetCurrency }} />
        <View style={styles.amountInputWrap}>
          <DaimoText style={styles.amountDollar}>{currency.symbol}</DaimoText>
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
      </View>
    </TouchableWithoutFeedback>
  );
}

function CurrencyPicker({
  allCurrencies,
  currency,
  onSetCurrency,
}: {
  allCurrencies: CurrencyExchangeRate[];
  currency: CurrencyExchangeRate;
  onSetCurrency: (currency: CurrencyExchangeRate) => void;
}) {
  const choose = (val: CurrencyExchangeRate) => {
    if (val == null) return;
    onSetCurrency(val);
  };

  return (
    <View style={{ width: 24, height: 24 }}>
      <SelectDropdown
        data={allCurrencies}
        defaultValue={currencyRateUSD}
        onSelect={choose}
        renderButton={(c) => (
          <View>
            <CurrencyPickButton currency={c} />
          </View>
        )}
        renderItem={(c) => (
          <View>
            <CurrencyPickItem currency={c} />
          </View>
        )}
        showsVerticalScrollIndicator
        dropdownStyle={styles.curDropdownStyle}
      />
    </View>
  );
}

function CurrencyPickButton({ currency }: { currency: CurrencyExchangeRate }) {
  return (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 24,
        backgroundColor: color.ivoryDark,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Octicons name="chevron-down" size={18} color={color.grayMid} />
    </View>
  );
}

function CurrencyPickItem({ currency }: { currency: CurrencyExchangeRate }) {
  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: color.grayLight,
        paddingHorizontal: 24,
        paddingVertical: 13,
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <DaimoText variant="dropdown">
        {currency.name} ({currency.currency})
      </DaimoText>
      <DaimoText variant="dropdown">{currency.symbol}</DaimoText>
    </View>
  );
}

const dim = Dimensions.get("window");
const isSmall = dim.width < 4007;

const styles = StyleSheet.create({
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  amountInputWrap: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  amountDollar: {
    fontSize: isSmall ? 50 : 56,
    fontWeight: "600",
    paddingBottom: 2,
    color: color.midnight,
    textAlign: "right",
  },
  amountInput: {
    fontSize: isSmall ? 56 : 64,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    color: color.midnight,
  },
  curDropdownStyle: {
    width: 220,
    backgroundColor: color.white,
    borderRadius: 13,
    flexDirection: "column",
  },
});

// Parse both 1.23 and 1,23
function parseLocalFloat(str?: string) {
  if (str == null || ["", ".", ","].includes(str)) return 0;
  return parseFloat(str.replace(",", "."));
}
