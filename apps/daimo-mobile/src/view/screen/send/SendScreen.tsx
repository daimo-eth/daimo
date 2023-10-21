import {
  DaimoAccountStatus,
  DaimoLink,
  DaimoRequestStatus,
  getAccountName,
} from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, View } from "react-native";

import { ScanTab } from "./ScanTab";
import { SearchTab } from "./SearchTab";
import { SendNoteTab } from "./SendNoteTab";
import { SendTransferButton } from "./SendTransferButton";
import { useFetchLinkStatus } from "../../../logic/linkStatus";
import { Recipient } from "../../../sync/recipients";
import { AmountChooser } from "../../shared/AmountInput";
import { ButtonBig } from "../../shared/Button";
import { ButtonWithStatus } from "../../shared/ButtonWithStatus";
import Spacer from "../../shared/Spacer";
import { ErrorRowCentered } from "../../shared/error";
import { ParamListSend, useNav } from "../../shared/nav";
import { color, ss } from "../../shared/style";
import { TextBody, TextCenter, TextH2 } from "../../shared/text";

type Props = NativeStackScreenProps<ParamListSend, "Send">;

type SendTab = "Search" | "Send Link" | "Scan";

// TODO: remove after upgrading react/expo to fix typescript error
const SegmentedControlFixed = SegmentedControl as any;

export default function SendScreen({ route }: Props) {
  console.log(`[SEND] rendering SendScreen ${JSON.stringify(route.params)}}`);
  const { link, recipient, dollars, requestId } = route.params || {};
  return (
    <View style={ss.container.bodyBetweenHeaderAndFooter}>
      <KeyboardAvoidingView behavior="height" keyboardVerticalOffset={128}>
        {!recipient && !link && <SendNav /> /* User picks who to pay */}
        {!recipient && link && <SendLoadRecipient {...{ link }} />}
        {recipient && dollars == null && (
          <SendChooseAmount recipient={recipient} />
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

function SendChooseAmount({ recipient }: { recipient: Recipient }) {
  // Select how much
  const [dollars, setDollars] = useState(0);

  // Once done, update nav
  const nav = useNav();
  const cancelRecipient = () =>
    nav.navigate("SendTab", { screen: "Send", params: {} });
  const setSendAmount = () =>
    nav.navigate("SendTab", {
      screen: "Send",
      params: { dollars: `${dollars}`, recipient },
    });

  return (
    <View>
      <Spacer h={32} />
      <AmountChooser
        actionDesc={<DescSendToRecipient recipient={recipient} />}
        onCancel={cancelRecipient}
        dollars={dollars}
        onSetDollars={setDollars}
        showAmountAvailable
      />
      <Spacer h={32} />
      <ButtonWithStatus
        button={
          <ButtonBig
            type="primary"
            title="Send"
            onPress={setSendAmount}
            disabled={dollars === 0}
          />
        }
        status=""
      />
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
  return (
    <View>
      <Spacer h={32} />
      <AmountChooser
        actionDesc={<DescSendToRecipient {...{ recipient, isRequest }} />}
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

function DescSendToRecipient({
  recipient,
  isRequest,
}: {
  recipient: Recipient;
  isRequest?: boolean;
}) {
  // Show who we're sending to
  const disp = getAccountName(recipient);

  return (
    <View>
      <TextCenter>
        <TextBody>{isRequest ? "Requested by" : "Sending to"}</TextBody>
      </TextCenter>
      <TextCenter>
        <TextH2>{disp}</TextH2>
      </TextCenter>
    </View>
  );
}
