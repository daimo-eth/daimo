import {
  AddrLabel,
  EAccount,
  OpStatus,
  TransferClog,
  assert,
  getDisplayFromTo,
  getTransferSummary,
  getTransferClogStatus,
  now,
  timeAgo,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { useContext, useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import {
  TouchableHighlight,
  TouchableOpacity,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getAddress } from "viem";

import { SetBottomSheetDetailHeight } from "./HistoryOpBottomSheet";
import { navToAccountPage, useNav } from "../../../common/nav";
import { env } from "../../../env";
import { i18NLocale, i18n } from "../../../i18n";
import {
  DaimoContact,
  EAccountContact,
  canSendToContact,
  getContactName,
  getTransferClogContact,
} from "../../../logic/daimoContacts";
import { Account } from "../../../storage/account";
import { getAmountText } from "../../shared/Amount";
import { ContactBubble } from "../../shared/Bubble";
import Spacer from "../../shared/Spacer";
import { FailedDot, PendingDot, ProcessingDot } from "../../shared/StatusDot";
import {
  DaimoText,
  TextBody,
  TextCenter,
  TextLight,
  TextMeta,
} from "../../shared/text";
import { Colorway } from "../../style/skins";
import { useTheme } from "../../style/theme";

interface HeaderObject {
  isHeader: true;
  id: string;
  month: string;
}
interface transferClogRenderObject {
  isHeader: false;
  id: string;
  op: TransferClog;
}

const i18 = i18n.historyList;

export function HistoryListSwipe({
  account,
  showDate,
  maxToShow,
  otherContact,
}: {
  account: Account;
  showDate: boolean;
  maxToShow?: number;
  otherContact?: DaimoContact;
}) {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);
  assert(
    !otherContact || otherContact.type === "eAcc",
    "Unsupported DaimoContact in HistoryListSwipe"
  );
  const otherEAccContact = otherContact
    ? (otherContact as EAccountContact)
    : undefined;

  const ins = useSafeAreaInsets();

  // Get relevant transfers in reverse chronological order
  let ops = account.recentTransfers.slice().reverse();
  if (otherEAccContact != null) {
    const otherAddr = otherEAccContact.addr;
    ops = ops.filter((op) => {
      const [from, to] = getDisplayFromTo(op);
      return from === otherAddr || to === otherAddr;
    });
  }
  console.log(`[HIST] HistoryListSwipe ${account.name}, ${ops.length} ops`);

  // Link to either the op (zoomed in) or the other account (zoomed out)
  // const linkTo = "op"; // Option to link to AccountPage instead.
  const linkTo = otherEAccContact == null ? "account" : "op";

  if (ops.length === 0) {
    return (
      <View>
        <Spacer h={16} />
        <TextCenter>
          <TextLight>{i18.empty()}</TextLight>
        </TextCenter>
      </View>
    );
  }

  const renderRow = (t: TransferClog) => (
    <TransferClogRow
      key={getTransferClogId(t)}
      transferClog={t}
      account={account}
      {...{ linkTo, showDate }}
    />
  );

  // Easy case: show a fixed, small preview list
  if (maxToShow != null) {
    const title =
      otherContact == null
        ? i18.screenHeader.default()
        : i18.screenHeader.other();
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
  const rows: (transferClogRenderObject | HeaderObject)[] = [];
  let language = i18NLocale.languageCode;

  // if null, set to english
  language ??= "default";

  // Render a HeaderRow for each month, and make it sticky
  let lastMonth = "";
  for (const op of ops) {
    const preMonth = new Date(op.timestamp * 1000).toLocaleString(language, {
      year: "numeric",
      month: "long",
    });

    // Make sure first letter to be uppercase
    const firstLetter = preMonth.at(0)!.toUpperCase();
    const month = firstLetter + preMonth.substring(1, preMonth.length);

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
      id: getTransferClogId(op),
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
        return renderRow(item.op);
      }}
    />
  );
}

function HeaderRow({ title }: { title: string }) {
  const { color, ss } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  return (
    <View style={styles.rowHeader}>
      <DaimoText style={[ss.text.body, { color: color.gray3 }]}>
        {title}
      </DaimoText>
    </View>
  );
}

function TransferClogRow({
  transferClog,
  account,
  linkTo,
  showDate,
}: {
  transferClog: TransferClog;
  account: Account;
  linkTo: "op" | "account";
  showDate?: boolean;
}) {
  const { color, touchHighlightUnderlay } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  const nav = useNav();
  const address = account.address;

  assert(
    transferClog.amount > 0,
    `TransferClogRow amount should be greater than 0. amount: ${transferClog.amount}`
  );
  const [from, to] = getDisplayFromTo(transferClog);
  assert(
    [from, to].includes(getAddress(address)),
    `TransferClogRow from and to should include address. from: ${from}, to: ${to}`
  );
  const setBottomSheetDetailHeight = useContext(SetBottomSheetDetailHeight);

  const otherContact = getTransferClogContact(transferClog, address);

  const amountDelta =
    from === address ? -transferClog.amount : transferClog.amount;

  const viewOp = () => {
    const height = transferClog.type === "createLink" ? 490 : 440;
    setBottomSheetDetailHeight(height);
    (nav as any).navigate("BottomSheetHistoryOp", {
      op: transferClog,
      shouldAddInset: false,
    });
  };

  const viewAccount = () => {
    // TODO: Temporarily disallow landline bank accounts
    if (otherContact.type === "landlineBankAccount") return false;
    // TODO: change `navToAccountPage` to accept `DaimoContact`
    if (canSendToContact(otherContact))
      navToAccountPage(otherContact as EAccount, nav);
    else viewOp();
  };

  const transferClogStatus = getTransferClogStatus(transferClog);
  const isPending = transferClogStatus === OpStatus.pending;
  const textCol = isPending ? color.gray3 : color.midnight;

  // Title = counterparty name
  let opTitle = getContactName(otherContact, i18NLocale);
  if (
    opTitle === AddrLabel.PaymentLink &&
    transferClog.type === "claimLink" &&
    transferClog.noteStatus.sender.addr === address &&
    transferClog.noteStatus.claimer?.addr === address
  ) {
    // Special case: we cancelled our own payment link
    opTitle = i18.op.cancelledLink();
  }

  const opSummary = getTransferSummary(
    transferClog,
    env(daimoChainFromId(account.homeChainId)).chainConfig,
    i18NLocale,
    true
  );
  const memoCol = isPending ? color.gray3 : color.grayDark;

  return (
    <View style={styles.transferBorder}>
      <TouchableHighlight
        onPress={viewOp}
        {...touchHighlightUnderlay.subtle}
        style={styles.transferClogRowWrap}
      >
        <View style={styles.transferClogRow}>
          <View style={styles.transferOtherAccount}>
            <TouchableOpacity
              onPress={viewAccount}
              disabled={
                linkTo === "op" || otherContact.label === AddrLabel.PaymentLink
              }
            >
              <ContactBubble
                contact={otherContact}
                size={36}
                {...{ isPending }}
              />
            </TouchableOpacity>
            <View style={{ flexDirection: "column" }}>
              <TextBody color={textCol}>{opTitle}</TextBody>
              {opSummary && (
                <>
                  <Spacer h={2} />
                  <TextMeta color={memoCol}>{opSummary}</TextMeta>
                </>
              )}
            </View>
            {isPending && <PendingDot />}
            {transferClogStatus === "processing" && <ProcessingDot />}
            {transferClogStatus === "failed" && <FailedDot />}
          </View>
          <TransferAmountDate
            amount={amountDelta}
            timestamp={transferClog.timestamp}
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
  const { color, ss } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  const dollarStr = getAmountText({ amount: BigInt(Math.abs(amount)) });
  const sign = amount < 0 ? "-" : "+";
  const amountColor = amount < 0 ? color.midnight : color.success;

  let timeStr: string;
  if (isPending) {
    timeStr = i18.op.pending();
  } else if (showDate) {
    timeStr = new Date(timestamp * 1000).toLocaleString("default", {
      month: "numeric",
      day: "numeric",
    });
  } else {
    const nowS = now();
    timeStr = timeAgo(timestamp, i18NLocale, nowS);
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

function getTransferClogId(t: TransferClog): string {
  return `${t.timestamp}-${t.from}-${t.to}-${t.txHash}-${t.opHash}`;
}

const getStyles = (color: Colorway) =>
  StyleSheet.create({
    historyListBody: {
      paddingHorizontal: 24,
      marginBottom: 48,
      backgroundColor: color.white,
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
    transferClogRowWrap: {
      marginHorizontal: -24,
    },
    transferClogRow: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: color.white,
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
