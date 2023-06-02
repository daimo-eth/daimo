import {
  Alert,
  NativeSyntheticEvent,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  TextInputFocusEventData,
} from "react-native";

import { useCallback, useState } from "react";
import { useAccount } from "../../logic/account";
import { ButtonBig } from "../shared/Button";
import { color } from "../shared/style";

export default function RequestScreen() {
  const [account] = useAccount();
  const [amount, setAmount] = useState(0);

  const url = `daimo://request?recipient=${account.address}&amount=${amount}`;
  const sendRequest = useCallback(async () => {
    try {
      const result = await Share.share({
        title: "Daimo Request" /* Android only */,
        message: `dcposch is requesting ${amount.toFixed(2)} USDC`,
        url,
      });
      console.log(`[REQUEST] action ${result.action}`);
      if (result.action === Share.sharedAction) {
        console.log(`[REQUEST] shared, activityType: ${result.activityType}`);
      } else if (result.action === Share.dismissedAction) {
        console.log(`[REQUEST] share dismissed`);
      }
    } catch (error: any) {
      Alert.alert(error.message);
    }
  }, [url]);

  return (
    <ScrollView contentContainerStyle={styles.vertOuter} bounces={false}>
      <AmountPicker value={amount} onChange={setAmount} />
      <ButtonBig
        disabled={amount <= 0}
        title="Send Request"
        onPress={sendRequest}
      />
    </ScrollView>
  );
}

function AmountPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (amount: number) => void;
}) {
  if (value < 0) throw new Error("AmountPicker value can't be negative");

  const [strVal, setStrVal] = useState(value === 0 ? "" : value.toFixed(2));

  // On blur, round value to 2 decimal places
  const blur = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      const value = e.nativeEvent.text;
      let newVal = parseFloat(value);
      if (!(newVal >= 0)) {
        newVal = 0;
      }
      const newStrVal = newVal.toFixed(2);
      setStrVal(newVal > 0 ? newStrVal : "");
      onChange(parseFloat(newStrVal));
    },
    []
  );

  const change = useCallback((text: string) => {
    setStrVal(text);
    onChange(parseFloat(text));
  }, []);

  return (
    <TextInput
      style={styles.amountPicker}
      keyboardType="numeric"
      placeholder="0.00"
      placeholderTextColor={color.gray}
      selectTextOnFocus
      value={strVal}
      onBlur={blur}
      onChangeText={change}
    />
  );
}

const styles = StyleSheet.create({
  vertOuter: {
    backgroundColor: color.white,
    flex: 1,
    padding: 32,
    paddingTop: 64,
    gap: 64,
    overflow: "hidden",
  },
  amountPicker: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    borderBottomColor: color.gray,
    borderBottomWidth: 1,
  },
});
