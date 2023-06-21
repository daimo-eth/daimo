import { tokenMetadata } from "@daimo/contract";
import { useCallback, useState } from "react";
import { Alert, ScrollView, Share, StyleSheet } from "react-native";

import { assert } from "../../logic/assert";
import { useAccount } from "../../model/account";
import { ButtonBig } from "../shared/Button";
import { AmountInput } from "../shared/Input";
import { color } from "../shared/style";

export default function RequestScreen() {
  const [account] = useAccount();
  assert(account != null);
  const [amount, setAmount] = useState(0);

  // TODO: use deep link
  const url = `daimo://request?recipient=${account.address}&amount=${amount}`;

  const sendRequest = useCallback(async () => {
    try {
      const result = await Share.share({
        title: "Daimo Request" /* Android only */,
        message: `dcposch is requesting ${amount.toFixed(2)} ${
          tokenMetadata.symbol
        }. Pay them using Daimo: ${url}`,
      });
      console.log(`[REQUEST] action ${result.action}`);
      if (result.action === Share.sharedAction) {
        console.log(`[REQUEST] shared, activityType: ${result.activityType}`);
      } else if (result.action === Share.dismissedAction) {
        // Only on iOS
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
