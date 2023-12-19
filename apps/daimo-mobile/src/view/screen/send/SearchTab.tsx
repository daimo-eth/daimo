import { getAccountName, getEAccountStr, timeAgo } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { useCallback, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableHighlight,
  View,
  ViewStyle,
} from "react-native";

import { Account } from "../../../model/account";
import { Recipient, useRecipientSearch } from "../../../sync/recipients";
import { useKeyboardHeight } from "../../../vendor/useKeyboardHeight";
import { AccountBubble, Bubble } from "../../shared/AccountBubble";
import { ButtonMed } from "../../shared/Button";
import { InputBig } from "../../shared/InputBig";
import Spacer from "../../shared/Spacer";
import { ErrorRowCentered } from "../../shared/error";
import { useNav } from "../../shared/nav";
import { color, touchHighlightUnderlay } from "../../shared/style";
import { TextBody, TextCenter, TextLight } from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";

/** Find someone you've already paid, a Daimo user by name, or any Ethereum account by ENS. */
export function SearchTab({
  autoFocus,
  textInnerRef,
}: {
  autoFocus: boolean;
  textInnerRef: React.RefObject<TextInput>;
}) {
  const [prefix, setPrefix] = useState("");

  return (
    <>
      <View style={{ flexGrow: 0 }}>
        <InputBig
          innerRef={textInnerRef}
          autoFocus={autoFocus}
          icon="search"
          placeholder="Search user, ENS, or address..."
          value={prefix}
          onChange={setPrefix}
        />
      </View>
      <Spacer h={16} />
      <SearchResults prefix={prefix} mode="send" />
    </>
  );
}

export function SearchResults({
  prefix,
  mode,
  style,
  lagAutoFocus,
}: {
  prefix: string;
  mode: "send" | "account";
  style?: ViewStyle;
  lagAutoFocus?: boolean;
}) {
  const Inner = useWithAccount(SearchResultsScroll);
  return (
    <View style={[styles.resultsWrap, style]}>
      <Inner prefix={prefix.trim().toLowerCase()} {...{ lagAutoFocus, mode }} />
    </View>
  );
}

function SearchResultsScroll({
  account,
  prefix,
  mode,
  lagAutoFocus,
}: {
  account: Account;
  prefix: string;
  mode: "send" | "account";
  lagAutoFocus?: boolean;
}) {
  const res = useRecipientSearch(account, prefix);

  const recentsOnly = prefix === "";

  const kbH = useKeyboardHeight();

  return (
    <ScrollView
      contentContainerStyle={styles.resultsScroll}
      keyboardShouldPersistTaps="handled"
    >
      {res.error && <ErrorRowCentered error={res.error} />}
      {recentsOnly && <ExtraRows lagAutoFocus={lagAutoFocus} />}
      {res.recipients.length > 0 && (
        <View style={styles.resultsHeader}>
          <TextLight>
            {recentsOnly ? "Recent recipients" : "Search results"}
          </TextLight>
        </View>
      )}
      {res.recipients.map((r) => (
        <RecipientRow key={r.addr} recipient={r} {...{ lagAutoFocus, mode }} />
      ))}
      {res.status === "success" &&
        res.recipients.length === 0 &&
        prefix !== "" && <NoSearchResults lagAutoFocus={lagAutoFocus} />}
      <Spacer h={32} />
      {Platform.OS === "ios" && <Spacer h={kbH} />}
    </ScrollView>
  );
}

function NoSearchResults({ lagAutoFocus }: { lagAutoFocus?: boolean }) {
  const nav = useNav();
  const sendPaymentLink = () =>
    nav.navigate("SendTab", {
      screen: "SendLink",
      params: { lagAutoFocus: lagAutoFocus ?? false },
    });

  return (
    <View>
      <Spacer h={16} />
      <TextCenter>
        <TextLight>No results</TextLight>
      </TextCenter>
      <Spacer h={32} />
      <ButtonMed
        type="subtle"
        title="SEND PAYMENT LINK INSTEAD"
        onPress={sendPaymentLink}
      />
    </View>
  );
}

function RecipientRow({
  recipient,
  mode,
  lagAutoFocus,
}: {
  recipient: Recipient;
  mode: "send" | "account";
  lagAutoFocus?: boolean;
}) {
  const eAccStr = getEAccountStr(recipient);
  const nav = useNav();
  const goToAccount = useCallback(() => {
    if (mode === "account") {
      nav.navigate("HomeTab", {
        screen: "Account",
        params: { eAcc: recipient },
      });
    } else {
      nav.navigate("SendTab", {
        screen: "SendTransfer",
        params: { recipient, lagAutoFocus: lagAutoFocus ?? false },
      });
    }
  }, [eAccStr, mode]);

  const name = getAccountName(recipient);
  const nowS = Date.now() / 1e3;
  const lastSendStr =
    recipient.lastSendTime &&
    `Sent ${timeAgo(recipient.lastSendTime, nowS, true)}`;

  return (
    <Row onPress={goToAccount}>
      <View style={styles.resultRow}>
        <View style={styles.resultAccount}>
          <AccountBubble eAcc={recipient} size={36} />
          <TextBody>{name}</TextBody>
        </View>
        <TextLight>{lastSendStr}</TextLight>
      </View>
    </Row>
  );
}

function ExtraRows({ lagAutoFocus }: { lagAutoFocus?: boolean }) {
  const nav = useNav();

  return (
    <>
      <ExtraRow
        title="Send via link"
        inside={<Octicons name="link" size={14} color={color.primary} />}
        onPress={() =>
          nav.navigate("SendTab", {
            screen: "SendLink",
            params: { lagAutoFocus: lagAutoFocus ?? false },
          })
        }
      />
      <ExtraRow
        title="Scan QR code"
        inside={<Octicons name="apps" size={14} color={color.primary} />}
        onPress={() =>
          nav.navigate("SendTab", {
            screen: "QR",
            params: { option: "SCAN" },
          })
        }
      />
    </>
  );
}

function ExtraRow({
  title,
  inside,
  onPress,
}: {
  title: string;
  inside: React.JSX.Element;
  onPress: () => void;
}) {
  return (
    <Row key={title} onPress={onPress}>
      <View style={styles.resultRow}>
        <View style={styles.resultAccount}>
          <Bubble size={36} fontSize={14}>
            {inside}
          </Bubble>
          <TextBody>{title}</TextBody>
        </View>
      </View>
    </Row>
  );
}

function Row({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <View>
      <TouchableHighlight
        onPress={onPress}
        {...touchHighlightUnderlay.subtle}
        style={styles.resultRowWrap}
      >
        {children}
      </TouchableHighlight>
    </View>
  );
}

const styles = StyleSheet.create({
  resultsWrap: {
    flex: 1,
    marginHorizontal: -16,
  },
  resultsScroll: {
    flexDirection: "column",
    alignSelf: "stretch",
    paddingHorizontal: 16,
  },
  resultsHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  resultRowWrap: {
    marginHorizontal: -24,
  },
  resultRow: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultAccount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
});
