import { StyleSheet, View } from "react-native";
import { Address } from "viem";

import { assert } from "../../logic/assert";
import { amountToDollars } from "../../logic/coin";
import { AccountHistory } from "../../model/accountHistory";
import { TransferOpEvent } from "../../model/op";
import { AddrText } from "../shared/AddrText";
import { ButtonSmall } from "../shared/Button";
import { useNav } from "../shared/nav";
import { OpStatusIndicator } from "../shared/opStatus";
import { ss } from "../shared/style";
import {
  TextBold,
  TextCenter,
  TextH3,
  TextRight,
  TextSmall,
} from "../shared/text";
import { timeAgo } from "../shared/time";

export function RecentHistory({ hist }: { hist?: AccountHistory }) {
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
      <View style={ss.container.ph16}>
        <TextH3>History</TextH3>
      </View>
      <View style={ss.spacer.h8} />
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
  transfer: TransferOpEvent;
  address: Address;
}) {
  assert(transfer.amount > 0);
  const from = transfer.from.toLowerCase() as Address;
  const to = transfer.to.toLowerCase() as Address;
  address = address.toLowerCase() as Address;
  assert([from, to].includes(address));

  const verb = from === address ? "Sent" : "Received";
  const amount = amountToDollars(BigInt(transfer.amount));
  const toFrom = from === address ? "to" : "from";
  const otherAddr = from === address ? to : from;

  const nowS = Date.now() / 1e3;

  const nav = useNav();
  const viewOp = () => nav.navigate("HistoryOp", { op: transfer });

  return (
    <ButtonSmall onPress={viewOp}>
      <View style={styles.rowTransfer}>
        <View style={styles.colDesc}>
          <TextSmall numberOfLines={1}>
            {verb} <TextBold>${amount}</TextBold> {toFrom}{" "}
            <AddrText addr={otherAddr} />
          </TextSmall>
        </View>
        <View style={styles.colTime}>
          <TextSmall numberOfLines={1}>
            <TextRight>{timeAgo(transfer.timestamp, nowS)}</TextRight>
          </TextSmall>
        </View>
        <View style={styles.colStatus}>
          <OpStatusIndicator status={transfer.status} />
        </View>
      </View>
    </ButtonSmall>
  );
}

const styles = StyleSheet.create({
  rowTransfer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  colDesc: {
    flex: 1,
  },
  colTime: {
    flex: 0,
    width: 40,
  },
  colStatus: {
    flex: 0,
    width: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
