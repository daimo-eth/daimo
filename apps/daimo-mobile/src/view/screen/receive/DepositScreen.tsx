import { tokenMetadata } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import * as Clipboard from "expo-clipboard";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableHighlight, View } from "react-native";
import { Address, getAddress } from "viem";

import { chainConfig } from "../../../logic/chainConfig";
import { rpcHook } from "../../../logic/trpc";
import { getAccountManager, useAccount } from "../../../model/account";
import { ButtonMed } from "../../shared/Button";
import Spacer from "../../shared/Spacer";
import { cacheEAccounts } from "../../shared/addr";
import { color, ss, touchHighlightUnderlay } from "../../shared/style";
import { TextBody, TextBold, TextLight } from "../../shared/text";

export default function DepositScreen() {
  const [account] = useAccount();
  if (account == null) return null;

  return (
    <View style={styles.vertOuter}>
      {chainConfig.testnet && <TestnetFaucet recipient={account.address} />}
      {chainConfig.testnet && <Spacer h={32} />}
      <OnrampStub />
      <Spacer h={32} />
      <TextBody>
        <TextBold>
          Deposit {tokenMetadata.symbol} on {chainConfig.l2.name} only.
        </TextBold>{" "}
        Use the following address.
      </TextBody>
      <Spacer h={16} />
      <AddressCopier addr={account.address} />
    </View>
  );
}

/** Request token from testnet faucet. */
function TestnetFaucet({ recipient }: { recipient: Address }) {
  const faucetStatus = rpcHook.testnetFaucetStatus.useQuery({ recipient });

  const mutation = rpcHook.testnetRequestFaucet.useMutation();
  const request = useCallback(() => {
    mutation.mutate({ recipient });
  }, [recipient]);

  // Show faucet payment in history promptly
  useEffect(() => {
    if (!mutation.isSuccess) return;
    getAccountManager().addPendingOp(mutation.data);
    cacheEAccounts([{ addr: getAddress(mutation.data.from), label: "faucet" }]);
  }, [mutation.isSuccess]);

  // Display
  let canRequest = false;
  let buttonType = "primary" as "primary" | "danger";
  let message = "Request $50 from faucet";
  if (mutation.isLoading) {
    message = "Loading...";
  } else if (mutation.isSuccess) {
    message = "Faucet payment sent";
  } else if (mutation.isError) {
    message = "Error";
    buttonType = "danger";
  } else if (faucetStatus.isError) {
    message = "Faucet unavailable";
  } else if (faucetStatus.isSuccess) {
    switch (faucetStatus.data) {
      case "unavailable":
        message = "Faucet unavailable";
        break;
      case "alreadyRequested":
        message = "Requested";
        break;
      case "alreadySent":
        message = "Faucet payment sent";
        break;
      case "canRequest":
        canRequest = true;
        break;
    }
  }

  return (
    <View style={styles.callout}>
      <TextBody>
        <Octicons name="alert" size={16} color="black" />{" "}
        <TextBold>Testnet version.</TextBold> This unreleased version of Daimo
        runs on {chainConfig.l2.name}.
      </TextBody>
      <Spacer h={16} />
      <ButtonMed
        title={message}
        onPress={request}
        type={buttonType}
        disabled={!canRequest}
      />
    </View>
  );
}

/** Coming soon: onramp, eg Coinbase Pay */
function OnrampStub() {
  return (
    <TextBody>
      <TextBold>On-ramp goes here.</TextBold> Soon, we'll link to exchanges like
      Coinbase so that you can deposit money from a bank account.
    </TextBody>
  );
}

function AddressCopier({ addr }: { addr: string }) {
  const [justCopied, setJustCopied] = useState(false);
  const copy = useCallback(async () => {
    await Clipboard.setStringAsync(addr);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1000);
  }, [addr]);

  return (
    <View style={styles.address}>
      <TouchableHighlight
        style={styles.addressButton}
        onPress={copy}
        {...touchHighlightUnderlay.blue}
      >
        <View style={styles.addressView}>
          <Text style={styles.addressMono} numberOfLines={1}>
            {addr}
          </Text>
          <Octicons name="copy" size={16} color="black" />
        </View>
      </TouchableHighlight>
      <TextLight>{justCopied ? "Copied" : " "}</TextLight>
    </View>
  );
}

const styles = StyleSheet.create({
  vertOuter: {
    backgroundColor: color.white,
    flex: 1,
    padding: 32,
    overflow: "hidden",
  },
  address: {
    flexDirection: "column",
    gap: 16,
    alignItems: "center",
  },
  addressButton: {
    borderRadius: 8,
    backgroundColor: color.bg.lightGray,
    padding: 16,
  },
  addressView: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  addressMono: {
    ...ss.text.mono,
    flexShrink: 1,
  },
  callout: {
    backgroundColor: color.bg.lightGray,
    padding: 16,
    marginHorizontal: -16,
    borderRadius: 24,
  },
});
