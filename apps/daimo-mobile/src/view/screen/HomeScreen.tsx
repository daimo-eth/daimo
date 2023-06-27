import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { Address, hexToBigInt } from "viem";

import { useWarmCache } from "../../action/useSendAsync";
import { assert } from "../../logic/assert";
import { amountToDollars } from "../../logic/coin";
import { useAccount } from "../../model/account";
import {
  AccountHistory,
  Transfer,
  useAccountHistory,
} from "../../model/accountHistory";
import { TitleAmount } from "../shared/Amount";
import { Button, buttonStyles } from "../shared/Button";
import { Header } from "../shared/Header";
import Spacer from "../shared/Spacer";
import { useNav } from "../shared/nav";
import { ss } from "../shared/style";
import { TextBody, TextCenter, TextSmall } from "../shared/text";

export default function HomeScreen() {
  const [account] = useAccount();
  console.log(`[HOME] rendering with account ${account?.name}`);

  useWarmCache(account?.enclaveKeyName);

  const nav = useNav();
  const goSend = useCallback(() => nav.navigate("Send"), [nav]);
  const goReceive = useCallback(() => nav.navigate("Receive"), [nav]);
  const goDeposit = useCallback(() => nav.navigate("Deposit"), [nav]);
  const goWithdraw = useCallback(() => nav.navigate("Withdraw"), [nav]);

  const [hist] = useAccountHistory(account?.address);

  if (account == null) return null;

  return (
    <View style={ss.container.outerStretch}>
      <Header />
      <View style={styles.amountAndButtons}>
        <TitleAmount amount={account.lastBalance} />
        <Spacer h={32} />
        <View style={styles.buttonRow}>
          <Button
            style={bigButton}
            title="Send"
            onPress={goSend}
            disabled={account.lastBalance === 0n}
          />
          <Button style={bigButton} title="Receive" onPress={goReceive} />
        </View>
        <Spacer h={8} />
        <View style={styles.buttonRow}>
          <Button
            style={smallButton}
            title="Withdraw"
            onPress={goWithdraw}
            disabled={account.lastBalance === 0n}
          />
          <Button style={smallButton} title="Deposit" onPress={goDeposit} />
        </View>
      </View>

      <View>
        <RecentHistory hist={hist} />
      </View>

      <View style={ss.spacer.h32} />
    </View>
  );
}

function RecentHistory({ hist }: { hist?: AccountHistory }) {
  if (hist == null) return null;

  const latest = hist.recentTransfers.slice().reverse().slice(0, 5);
  if (latest.length === 0) {
    return (
      <View>
        <TextCenter>
          <TextSmall>No transactions yet</TextSmall>
        </TextCenter>
      </View>
    );
  }

  return (
    <View>
      {latest.map((t) => (
        <TransferRow
          key={`${t.timestamp}-${t.from}-${t.to}`}
          transfer={t}
          address={hist.address}
        />
      ))}
    </View>
  );
}

function TransferRow({
  transfer,
  address,
}: {
  transfer: Transfer;
  address: Address;
}) {
  assert(transfer.amount > 0);
  assert([transfer.from, transfer.to].includes(address));

  const verb = transfer.from === address ? "Sent" : "Received";
  const amount = amountToDollars(BigInt(transfer.amount));
  const toFrom = transfer.from === address ? "to" : "from";
  const otherAddr = transfer.from === address ? transfer.to : transfer.from;
  // TODO: name lookup
  const other = otherAddr.substring(0, 8) + "...";

  return (
    <View style={styles.transferRow}>
      <TextBody>
        {verb} ${amount} {toFrom} {other}
      </TextBody>
    </View>
  );
}

const styles = StyleSheet.create({
  amountAndButtons: {
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 24,
  },
  transferRow: {
    padding: 8,
  },
});

const bigButton = StyleSheet.create({
  button: {
    ...buttonStyles.big.button,
    width: 128,
  },
  title: buttonStyles.big.title,
});

const smallButton = StyleSheet.create({
  button: {
    ...buttonStyles.small.button,
    width: 128,
    height: 48,
    justifyContent: "center",
  },
  title: buttonStyles.small.title,
});
