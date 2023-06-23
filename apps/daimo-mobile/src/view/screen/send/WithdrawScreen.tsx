import { tokenMetadata } from "@daimo/contract";
import { Octicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { chainConfig } from "../../../logic/chain";
import { useAccount } from "../../../model/account";
import Spacer from "../../shared/Spacer";
import { color } from "../../shared/style";
import { TextBody, TextBold } from "../../shared/text";

export default function WithdrawScreen() {
  const [account] = useAccount();
  if (account == null) return null;

  return (
    <View style={styles.vertOuter}>
      {chainConfig.testnet && <TestnetWarning />}
      {chainConfig.testnet && <Spacer h={32} />}
      <OfframpStub />
    </View>
  );
}

/** Request token from testnet faucet. */
function TestnetWarning() {
  return (
    <View style={styles.callout}>
      <TextBody>
        <Octicons name="alert" size={16} color="black" />{" "}
        <TextBold>Testnet version.</TextBold> This unreleased version of Daimo
        runs on Base Goerli.
      </TextBody>
    </View>
  );
}

/** Coming soon: onramp, eg Coinbase Pay */
function OfframpStub() {
  const { symbol } = tokenMetadata;
  return (
    <TextBody>
      <TextBold>Off-ramp goes here.</TextBold> Soon, we'll link to exchanges
      like Coinbase so that you can withdraw {symbol} to a bank account
      smoothly.
    </TextBody>
  );
}

const styles = StyleSheet.create({
  vertOuter: {
    backgroundColor: color.white,
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: "hidden",
  },
  callout: {
    backgroundColor: color.bg.lightGray,
    padding: 16,
    marginHorizontal: -16,
    borderRadius: 24,
  },
});
