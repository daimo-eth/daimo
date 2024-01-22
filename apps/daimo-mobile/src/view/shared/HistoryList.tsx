import {
  AddrLabel,
  DisplayOpEvent,
  EAccount,
  OpStatus,
  assert,
  canSendTo,
  getAccountName,
  timeAgo,
} from "@daimo/common";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { useCallback, useContext } from "react";
import { Platform, StyleSheet, View } from "react-native";
import {
  TouchableOpacity,
  TouchableHighlight,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "viem";

import { getAmountText } from "./Amount";
import { ContactBubble } from "./ContactBubble";
import { PendingDot } from "./PendingDot";
import Spacer from "./Spacer";
import { CallbackContext } from "./SwipeUpDown";
import { useNav } from "./nav";
import { color, ss, touchHighlightUnderlay } from "./style";
import { DaimoText, TextBody, TextCenter, TextLight } from "./text";
import { getCachedEAccount } from "../../logic/addr";
import { Account } from "../../model/account";

interface HeaderObject {
  isHeader: true;
  id: string;
  month: string;
}
interface DisplayOpRenderObject {
  isHeader: false;
  id: string;
  op: DisplayOpEvent;
}

export function HistoryListSwipe({
  account,
  showDate,
  maxToShow,
  otherAcc,
}: {
  account: Account;
  showDate: boolean;
  maxToShow?: number;
  otherAcc?: EAccount;
}) {
  const ins = useSafeAreaInsets();

  // Get relevant transfers in reverse chronological order
  let ops = account.recentTransfers.slice().reverse();
  if (otherAcc != null) {
    const otherAddr = otherAcc.addr;
    ops = ops.filter((op) => {
      const [from, to] = getFromTo(op);
      return from === otherAddr || to === otherAddr;
    });
  }
  console.log(`[HIST] HistoryListSwipe ${account.name}, ${ops.length} ops`);

  // Link to either the op (zoomed in) or the other account (zoomed out)
  // const linkTo = "op"; // Option to link to AccountPage instead.
  const linkTo = otherAcc == null ? "account" : "op";

  if (ops.length === 0) {
    return (
      <View>
        <Spacer h={16} />
        <TextCenter>
          <TextLight>No transactions yet</TextLight>
        </TextCenter>
      </View>
    );
  }

  const renderRow = (t: DisplayOpEvent) => (
    <DisplayOpRow
      key={getDisplayOpId(t)}
      displayOp={t}
      address={account.address}
      {...{ linkTo, showDate }}
    />
  );

  // Easy case: show a fixed, small preview list
  if (maxToShow != null) {
    const title =
      otherAcc == null ? "Transaction history" : `Transactions between you`;
    return (
      <View style={styles.historyListBody}>
        <HeaderRow key="h0" title={title} />
        {ops.slice(0, maxToShow).map(renderRow)}
        <View style={styles.transferBorder} />
      </View>
    );
  }

  // Full case: show a scrollable, lazy-loaded FlatList
  const stickyIndices = [] as number[];
  const rows: (DisplayOpRenderObject | HeaderObject)[] = [];

  // Render a HeaderRow for each month, and make it sticky
  let lastMonth = "";
  for (const op of ops) {
    const month = new Date(op.timestamp * 1000).toLocaleString("default", {
      year: "numeric",
      month: "long",
    });
    if (month !== lastMonth) {
      stickyIndices.push(rows.length);
      rows.push({
        isHeader: true,
        month,
        id: month,
      });
      lastMonth = month;
    }
    rows.push({
      isHeader: false,
      id: getDisplayOpId(op),
      op,
    });
  }

  return (
    <BottomSheetFlatList
      ListFooterComponent={() => {
        return <Spacer h={ins.bottom + (Platform.OS === "ios" ? 64 : 128)} />;
      }}
      contentContainerStyle={styles.historyListBody}
      data={rows}
      keyExtractor={({ id }) => id}
      renderItem={({ item }) => {
        if (item.isHeader) {
          return <HeaderRow key={item.month} title={item.month} />;
        }
        return (
          <DisplayOpRow
            displayOp={item.op}
            address={account.address}
            showDate
            {...{ linkTo }}
          />
        );
      }}
    />
  );
}

function HeaderRow({ title }: { title: string }) {
  return (
    <View style={styles.rowHeader}>
      <DaimoText style={[ss.text.body, { color: color.gray3 }]}>
        {title}
      </DaimoText>
    </View>
  );
}

function getFromTo(op: DisplayOpEvent): [Address, Address] {
  if (op.type === "transfer") {
    return [op.from, op.to];
  } else {
    if (op.noteStatus.claimer?.addr === op.noteStatus.sender.addr) {
      // Self-transfer via payment link shows up as two payment link transfers
      return [op.from, op.to];
    }
    return [
      op.noteStatus.sender.addr,
      op.noteStatus.claimer ? op.noteStatus.claimer.addr : op.to,
    ];
  }
}

function DisplayOpRow({
  displayOp,
  address,
  linkTo,
  showDate,
}: {
  displayOp: DisplayOpEvent;
  address: Address;
  linkTo: "op" | "account";
  showDate?: boolean;
}) {
  assert(displayOp.amount > 0);
  const [from, to] = getFromTo(displayOp);
  assert([from, to].includes(address));
  const moveShouldOpenBottomSheet = useContext(CallbackContext);

  const otherAddr = from === address ? to : from;
  const otherAcc = getCachedEAccount(otherAddr);
  const amountDelta = from === address ? -displayOp.amount : displayOp.amount;

  const nav = useNav();
  const viewOp = useCallback(
    (isLinkToOp: boolean) => {
      // Workaround: react-navigation typescript types are broken.
      // currentTab is eg "SendNav", is NOT in fact a ParamListTab:
      const currentTab = nav.getState().routes[0].name;
      const newTab = currentTab.startsWith("Send") ? "SendTab" : "HomeTab";
      if (isLinkToOp || !canSendTo(otherAcc)) {
        moveShouldOpenBottomSheet(true);
        (nav as any).navigate("BottomSheetHistoryOp", {
          op: displayOp,
          shouldAddInset: false,
        });
      } else {
        nav.navigate(newTab, { screen: "Account", params: { eAcc: otherAcc } });
      }
    },
    [nav, displayOp, linkTo, otherAcc]
  );

  const isPending = displayOp.status === OpStatus.pending;
  const textCol = isPending ? color.gray3 : color.midnight;

  return (
    <View style={styles.transferBorder}>
      <TouchableHighlight
        onPress={() => viewOp(true)}
        {...touchHighlightUnderlay.subtle}
        style={styles.displayOpRowWrap}
      >
        <View style={styles.displayOpRow}>
          <View style={styles.transferOtherAccount}>
            <TouchableOpacity
              onPress={() => viewOp(false)}
              disabled={
                linkTo === "op" || otherAcc.label === AddrLabel.PaymentLink
              }
            >
              <ContactBubble
                contact={{ type: "eAcc", ...otherAcc }}
                size={36}
                {...{ isPending }}
              />
            </TouchableOpacity>

            <TextBody color={textCol}>{getAccountName(otherAcc)}</TextBody>
            {isPending && <PendingDot />}
          </View>
          <TransferAmountDate
            amount={amountDelta}
            timestamp={displayOp.timestamp}
            showDate={showDate}
            {...{ isPending }}
          />
        </View>
      </TouchableHighlight>
    </View>
  );
}

function TransferAmountDate({
  amount,
  timestamp,
  showDate,
  isPending,
}: {
  amount: number;
  timestamp: number;
  showDate?: boolean;
  isPending?: boolean;
}) {
  const dollarStr = getAmountText({ amount: BigInt(Math.abs(amount)) });
  const sign = amount < 0 ? "-" : "+";
  const amountColor = amount < 0 ? color.midnight : color.success;

  let timeStr: string;
  if (isPending) {
    timeStr = "Pending";
  } else if (showDate) {
    timeStr = new Date(timestamp * 1000).toLocaleString("default", {
      month: "numeric",
      day: "numeric",
    });
  } else {
    const nowS = Date.now() / 1e3;
    timeStr = timeAgo(timestamp, nowS);
  }

  const textCol = isPending ? color.gray3 : color.midnight;
  const amountCol = isPending ? color.gray3 : amountColor;

  return (
    <View style={styles.transferAmountDate}>
      <DaimoText style={[ss.text.metadata, { color: amountCol }]}>
        {sign} {dollarStr}
      </DaimoText>
      <DaimoText style={[ss.text.metadataLight, { color: textCol }]}>
        {timeStr}
      </DaimoText>
    </View>
  );
}

function getDisplayOpId(t: DisplayOpEvent): string {
  return `${t.timestamp}-${t.from}-${t.to}-${t.txHash}-${t.opHash}`;
}

const styles = StyleSheet.create({
  historyListBody: {
    paddingHorizontal: 24,
    marginBottom: 48,
  },
  rowHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingTop: 16,
    paddingHorizontal: 2,
    backgroundColor: color.white,
  },
  transferBorder: {
    borderTopWidth: 1,
    borderColor: color.grayLight,
    backgroundColor: "white",
  },
  displayOpRowWrap: {
    marginHorizontal: -24,
  },
  displayOpRow: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  transferOtherAccount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  transferAmountDate: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 2,
  },
});
