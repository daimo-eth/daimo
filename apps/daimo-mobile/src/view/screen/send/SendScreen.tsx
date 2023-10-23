import {
  DaimoAccountStatus,
  DaimoLink,
  DaimoRequestStatus,
  getAccountName,
} from "@daimo/common";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  StyleSheet,
  View,
} from "react-native";

import { ScanTab } from "./ScanTab";
import { SearchTab } from "./SearchTab";
import { SendNoteTab } from "./SendNoteTab";
import { SendTransferButton } from "./SendTransferButton";
import { useFetchLinkStatus } from "../../../logic/linkStatus";
import { Recipient } from "../../../sync/recipients";
import { AccountBubble } from "../../shared/AccountBubble";
import { AmountChooser } from "../../shared/AmountInput";
import { ButtonBig } from "../../shared/Button";
import { InfoBubble } from "../../shared/InfoBubble";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { ErrorRowCentered } from "../../shared/error";
import { ParamListSend, useNav } from "../../shared/nav";
import { color, ss } from "../../shared/style";
import { TextBody, TextH3 } from "../../shared/text";

type Props = NativeStackScreenProps<ParamListSend, "Send">;

type SendTab = "Search" | "Send Link" | "Scan";

// TODO: remove after upgrading react/expo to fix typescript error
const SegmentedControlFixed = SegmentedControl as any;

export default function SendScreen({ route }: Props) {
  console.log(`[SEND] rendering SendScreen ${JSON.stringify(route.params)}}`);
  const { link, recipient, dollars, requestId } = route.params || {};

  const nav = useNav();
  const back = useCallback(() => {
    const goTo = (params: Props["route"]["params"]) =>
      nav.navigate("SendTab", { screen: "Send", params });
    if (dollars != null) goTo({ recipient });
    else if (recipient != null) goTo({});
    else nav.reset({ routes: [{ name: "HomeTab" }] });
  }, [nav, dollars, recipient]);

  return (
    <View style={ss.container.screen}>
      <ScreenHeader title="Send funds to" onBack={back} />
      <Spacer h={8} />
      <KeyboardAvoidingView behavior="height" keyboardVerticalOffset={128}>
        {!recipient && !link && <SendNav /> /* User picks who to pay */}
        {!recipient && link && <SendLoadRecipient {...{ link }} />}
        {recipient && dollars == null && (
          <SendChooseAmount recipient={recipient} onCancel={back} />
        )}
        {recipient && dollars != null && (
          <SendConfirm {...{ recipient, dollars, requestId }} />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

function SendNav() {
  // Navigation
  const [tab, setTab] = useState<SendTab>("Search");
  const [tabs] = useState(["Search", "Send Link", "Scan"] as SendTab[]);

  return (
    <View>
      <SegmentedControlFixed
        values={tabs}
        selectedIndex={tabs.indexOf(tab)}
        onValueChange={setTab}
        fontStyle={{ ...ss.text.body, color: color.grayDark }}
        activeFontStyle={ss.text.body}
        style={{ height: 48, backgroundColor: color.ivoryDark }}
      />
      <Spacer h={24} />
      {tab === "Search" && <SearchTab />}
      {tab === "Send Link" && <SendNoteTab />}
      {tab === "Scan" && <ScanTab />}
    </View>
  );
}

function SendLoadRecipient({ link }: { link: DaimoLink }) {
  const nav = useNav();
  const status = useFetchLinkStatus(link)!;
  useEffect(() => {
    if (status.data == null) return;
    const { data } = status;
    switch (data.link.type) {
      case "account": {
        const { account } = data as DaimoAccountStatus;
        nav.navigate("SendTab", {
          screen: "Send",
          params: { recipient: account },
        });
        break;
      }
      case "request": {
        // TODO: handle fulfilledBy (request already completed)
        const { recipient, requestId } = data as DaimoRequestStatus;
        const { dollars } = data.link;
        nav.navigate("SendTab", {
          screen: "Send",
          params: { recipient, requestId, dollars },
        });
        break;
      }
    }
  }, [status]);

  return (
    <View style={ss.container.center}>
      {status.isLoading && <ActivityIndicator size="large" />}
      {status.error && <ErrorRowCentered error={status.error} />}
    </View>
  );
}

function SendChooseAmount({
  recipient,
  onCancel,
}: {
  recipient: Recipient;
  onCancel: () => void;
}) {
  // Select how much
  const [dollars, setDollars] = useState(0);

  // Once done, update nav
  const nav = useNav();
  const setSendAmount = () =>
    nav.navigate("SendTab", {
      screen: "Send",
      params: { dollars: `${dollars}`, recipient },
    });

  // Warn if paying new account
  let infoBubble = <Spacer h={32} />;
  if (recipient.lastSendTime == null) {
    infoBubble = (
      <InfoBubble
        title={`First time paying ${getAccountName(recipient)}`}
        subtitle="Ensure the recipient is correct"
      />
    );
  }

  return (
    <View>
      <Spacer h={8} />
      {infoBubble}
      <Spacer h={32} />
      <RecipientDisplay recipient={recipient} />
      <Spacer h={24} />
      <AmountChooser
        dollars={dollars}
        onSetDollars={setDollars}
        showAmountAvailable
      />
      <Spacer h={32} />
      <View style={styles.buttonRow}>
        <View style={styles.buttonGrow}>
          <ButtonBig type="subtle" title="Cancel" onPress={onCancel} />
        </View>
        <View style={styles.buttonGrow}>
          <ButtonBig
            type="primary"
            title="Send"
            onPress={setSendAmount}
            disabled={dollars === 0}
          />
        </View>
      </View>
    </View>
  );
}

function SendConfirm({
  recipient,
  dollars,
  requestId,
}: {
  recipient: Recipient;
  dollars: `${number}`;
  requestId?: `${bigint}`;
}) {
  const nDollars = parseFloat(dollars);
  const isRequest = requestId != null;

  // Warn if paying new account
  let infoBubble = <Spacer h={32} />;
  if (recipient.lastSendTime == null) {
    infoBubble = (
      <InfoBubble
        title={`First time paying ${getAccountName(recipient)}`}
        subtitle="Ensure the recipient is correct"
      />
    );
  }

  return (
    <View>
      <Spacer h={8} />
      {infoBubble}
      <Spacer h={32} />
      <RecipientDisplay {...{ recipient, isRequest }} />
      <Spacer h={24} />
      <AmountChooser
        dollars={nDollars}
        onSetDollars={useCallback(() => {}, [])}
        disabled
        showAmountAvailable={false}
      />
      <Spacer h={32} />
      <SendTransferButton {...{ recipient, dollars: nDollars, requestId }} />
    </View>
  );
}

function RecipientDisplay({
  recipient,
  isRequest,
}: {
  recipient: Recipient;
  isRequest?: boolean;
}) {
  // Show who we're sending to
  const disp = getAccountName(recipient);

  return (
    <View style={styles.recipientDisp}>
      <AccountBubble eAcc={recipient} size={64} />
      {isRequest && <TextBody>Requested by</TextBody>}
      <Spacer h={16} />
      <TextH3>{disp}</TextH3>
    </View>
  );
}

const styles = StyleSheet.create({
  recipientDisp: {
    flexDirection: "column",
    alignItems: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 18,
    marginHorizontal: 8,
  },
  buttonGrow: {
    flex: 1,
  },
});
