import {
  CurrencyExchangeRate,
  currencyRateUSD,
  LocalMoneyEntry,
  MoneyEntry,
} from "@daimo/common";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Badge } from "./Badge";
import { DropdownPickButton } from "./DropdownPickButton";
import Spacer from "./Spacer";
import { DaimoText, MAX_FONT_SIZE_MULTIPLIER, TextLight } from "./text";
import { i18n } from "../../i18n";
import { useAccount } from "../../logic/accountManager";
import { Colorway } from "../style/skins";
import { useTheme } from "../style/theme";

// Input components allows entry in range $0.01 to $99,999.99
const MAX_TOTAL_DIGITS = 7;
const i18 = i18n.amountInput;

export function AmountChooser({
  moneyEntry,
  onSetEntry,
  showAmountAvailable,
  showCurrencyPicker,
  autoFocus,
  disabled,
  innerRef,
  onFocus,
}: {
  moneyEntry: MoneyEntry;
  onSetEntry: (entry: MoneyEntry) => void;
  showAmountAvailable: boolean;
  showCurrencyPicker: boolean;
  autoFocus: boolean;
  disabled?: boolean;
  innerRef?: React.RefObject<TextInput>;
  onFocus?: () => void;
}) {
  const { color, ss } = useTheme();

  // Show how much we have available
  const account = useAccount();

  if (account == null) return null;

  const dollarsAvailStr = getAmountText({ amount: account.lastBalance });

  const setEntry = (entry: LocalMoneyEntry) => {
    const { localUnits, currency } = entry;
    const cents = Math.round(localUnits * currency.rateUSD * 100);
    onSetEntry({ ...entry, dollars: cents / 100 });
  };

  const isNonUSD = moneyEntry.currency.currency !== "USD";

  return (
    <View style={ss.container.padH16}>
      <AmountInput
        moneyEntry={moneyEntry}
        onChange={setEntry}
        disabled={disabled}
        innerRef={innerRef}
        autoFocus={autoFocus}
        onFocus={onFocus}
        showCurrencyPicker={showCurrencyPicker}
      />
      <Spacer h={4} />
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        {isNonUSD && (
          <Badge color={color.midnight}>
            = ${moneyEntry.dollars.toFixed(2)}
          </Badge>
        )}
        {showAmountAvailable && !isNonUSD && (
          <TextLight>{i18.dollarsAvailable(dollarsAvailStr)}</TextLight>
        )}
      </View>
    </View>
  );
}

function AmountInput({
  moneyEntry,
  onChange,
  innerRef,
  autoFocus,
  disabled,
  onFocus,
  showCurrencyPicker,
}: {
  moneyEntry: LocalMoneyEntry;
  onChange: (dollars: LocalMoneyEntry) => void;
  innerRef?: React.RefObject<TextInput>;
  autoFocus?: boolean;
  disabled?: boolean;
  onFocus?: () => void;
  showCurrencyPicker?: boolean;
}) {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  const { localUnits, currency } = moneyEntry;
  if (localUnits < 0) throw new Error("AmountPicker value can't be negative");

  const fmt = (units: number) =>
    units.toFixed(currency.decimals).replace(".", amountSeparator);

  const [strVal, setStrVal] = useState(localUnits <= 0 ? "" : fmt(localUnits));

  // While typing, show whatever the user is typing
  const change = (text: string) => {
    if (disabled) return;

    // Haptic (tactile) feedback on each keypress
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Validate. Handle negative numbers, NaN, out of range.
    const looksValid = /^(|0|(0?[.,]\d*)|([1-9]\d*[.,]?\d*))$/.test(text);
    const newVal = parseLocalFloat(text);
    const maxVal = Math.pow(10, MAX_TOTAL_DIGITS - currency.decimals);
    if (!looksValid || !(newVal >= 0) || newVal >= maxVal) {
      // reject input
      return;
    }

    // Max n decimals: if necessary, modify entry
    const { decimals } = currency;
    const parts = text.split(/[.,]/);
    if (parts.length >= 2) {
      const fractional = parts[1].slice(0, decimals);
      const roundedStr = `${parts[0]}${amountSeparator}${fractional}`;
      const roundedVal = parseLocalFloat(`${parts[0]}.${fractional}`);
      setStrVal(roundedStr);
      onChange({ currency, localUnits: roundedVal });
      return;
    }

    // Accept entry as-is
    setStrVal(text);
    onChange({ currency, localUnits: newVal });
  };

  // Once we're done, format value to n decimal places
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
    onChange({ currency, localUnits: truncated });
  };

  const otherRef = useRef<TextInput>(null);
  const ref = innerRef || otherRef;

  // Controlled component, but with state to allow typing "0", "0.", etc.
  useEffect(() => {
    if (ref.current?.isFocused()) return;
    setStrVal(localUnits <= 0 ? "" : fmt(localUnits));
  }, [localUnits]);

  const focus = useCallback(() => {
    ref.current?.focus();
    if (onFocus) onFocus();
  }, [ref, onFocus]);

  // Currency picker
  const account = useAccount();
  const allCurrencies = [currencyRateUSD, ...(account?.exchangeRates || [])];
  const onSetCurrency = (currency: CurrencyExchangeRate) => {
    onChange({ currency, localUnits });
  };
  const showPicker = !disabled && showCurrencyPicker !== false;

  return (
    <TouchableWithoutFeedback onPress={focus} accessible={false}>
      <View style={styles.amountRow}>
        {showPicker && <CurrencyPicker {...{ allCurrencies, onSetCurrency }} />}
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
        {!disabled && <View style={styles.currencyPickerWrap} /* center */ />}
      </View>
    </TouchableWithoutFeedback>
  );
}

function CurrencyPicker({
  allCurrencies,
  onSetCurrency,
}: {
  allCurrencies: CurrencyExchangeRate[];
  onSetCurrency: (currency: CurrencyExchangeRate) => void;
}) {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  const choose = (val: CurrencyExchangeRate) => {
    if (val == null) return;
    onSetCurrency(val);
  };

  return (
    <View style={styles.currencyPickerWrap}>
      <SelectDropdown
        data={allCurrencies}
        defaultValue={currencyRateUSD}
        onSelect={choose}
        renderButton={() => (
          <View style={styles.currencyButton}>
            <DropdownPickButton />
          </View>
        )}
        renderItem={(c) => (
          <View>
            <CurrencyPickItem currency={c} />
          </View>
        )}
        showsVerticalScrollIndicator
        dropdownStyle={styles.currencyDropdown}
      />
    </View>
  );
}

function CurrencyPickItem({ currency }: { currency: CurrencyExchangeRate }) {
  const { color } = useTheme();
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
const isSmall = dim.width < 375;

const getStyles = (color: Colorway) =>
  StyleSheet.create({
    amountRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
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
    currencyPickerWrap: {
      width: 40,
      height: 40,
    },
    currencyButton: {
      padding: 8,
    },
    currencyDropdown: {
      width: 256,
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
