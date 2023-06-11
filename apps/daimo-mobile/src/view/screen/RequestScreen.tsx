import { Alert, ScrollView, Share, StyleSheet } from "react-native";
import { useCallback, useState } from "react";

import { useAccount } from "../../logic/account";
import { ButtonBig } from "../shared/Button";
import { AmountInput } from "../shared/Input";
import { color } from "../shared/style";
import { assert } from "../../logic/assert";

export default function RequestScreen() {
  const [account] = useAccount();
  assert(account != null);
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
      <AmountInput value={amount} onChange={setAmount} />
      <ButtonBig
        disabled={amount <= 0}
        title="Send Request"
        onPress={sendRequest}
      />
    </ScrollView>
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
});
