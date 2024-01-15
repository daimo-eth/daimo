import { timeAgo } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import * as Contacts from "expo-contacts";
import { useCallback } from "react";
import {
  Platform,
  ScrollView,
  TouchableHighlight,
  View,
  ViewStyle,
  StyleSheet,
} from "react-native";

import {
  useRecipientSearch,
  DaimoContact,
  getContactName,
} from "../../../logic/daimoContacts";
import { ContactsAccess } from "../../../logic/systemContacts";
import { Account } from "../../../model/account";
import { useKeyboardHeight } from "../../../vendor/useKeyboardHeight";
import { ButtonMed } from "../../shared/Button";
import { ContactBubble, Bubble } from "../../shared/ContactBubble";
import Spacer from "../../shared/Spacer";
import { ErrorRowCentered } from "../../shared/error";
import { useNav } from "../../shared/nav";
import { color, touchHighlightUnderlay } from "../../shared/style";
import { TextLight, TextCenter, TextBody } from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";

export function SearchResults({
  contactsAccess,
  prefix,
  mode,
  style,
  lagAutoFocus,
}: {
  contactsAccess: ContactsAccess;
  prefix: string;
  mode: "send" | "account";
  style?: ViewStyle;
  lagAutoFocus?: boolean;
}) {
  const Inner = useWithAccount(SearchResultsScroll);
  return (
    <View style={[styles.resultsWrap, style]}>
      <Inner
        prefix={prefix.trim().toLowerCase()}
        {...{ lagAutoFocus, mode, contactsAccess }}
      />
    </View>
  );
}

function SearchResultsScroll({
  account,
  contactsAccess,
  prefix,
  mode,
  lagAutoFocus,
}: {
  contactsAccess: ContactsAccess;
  account: Account;
  prefix: string;
  mode: "send" | "account";
  lagAutoFocus?: boolean;
}) {
  const { permission: contactsPermission, ask: requestContactsPermission } =
    contactsAccess;

  const res = useRecipientSearch(
    account,
    prefix,
    contactsPermission?.granted || false
  );

  const recentsOnly = prefix === "";

  const kbH = useKeyboardHeight();

  return (
    <ScrollView
      contentContainerStyle={styles.resultsScroll}
      keyboardShouldPersistTaps="handled"
    >
      {res.error && <ErrorRowCentered error={res.error} />}
      {recentsOnly && contactsPermission && (
        <ExtraRows
          contactsPermission={contactsPermission}
          requestContactsPermission={requestContactsPermission}
          lagAutoFocus={lagAutoFocus}
        />
      )}
      {res.recipients.length > 0 && (
        <View style={styles.resultsHeader}>
          <TextLight>
            {recentsOnly ? "Recent recipients" : "Search results"}
          </TextLight>
        </View>
      )}
      {res.recipients.map((r, index) => (
        <RecipientRow key={index} recipient={r} {...{ lagAutoFocus, mode }} />
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
  recipient: DaimoContact;
  mode: "send" | "account";
  lagAutoFocus?: boolean;
}) {
  const name = getContactName(recipient);
  const nav = useNav();
  const goToAccount = useCallback(() => {
    switch (recipient.type) {
      case "email":
      case "phoneNumber": {
        nav.navigate("SendTab", {
          screen: "SendLink",
          params: { recipient, lagAutoFocus: lagAutoFocus ?? false },
        });
        return;
      }
      case "eAcc": {
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
      }
    }
  }, [name, mode]);

  const nowS = Date.now() / 1e3;
  const lastSendStr =
    recipient.lastSendTime &&
    `Sent ${timeAgo(recipient.lastSendTime, nowS, true)}`;

  return (
    <Row onPress={goToAccount}>
      <View style={styles.resultRow}>
        <View style={styles.resultAccount}>
          <ContactBubble contact={recipient} size={36} />
          <TextBody>{name}</TextBody>
        </View>
        <TextLight>{lastSendStr}</TextLight>
      </View>
    </Row>
  );
}

function ExtraRows({
  contactsPermission,
  requestContactsPermission,
  lagAutoFocus,
}: {
  contactsPermission: Contacts.PermissionResponse;
  requestContactsPermission: () => void;
  lagAutoFocus?: boolean;
}) {
  const nav = useNav();

  return (
    <>
      {!contactsPermission.granted && (
        <ExtraRow
          title="Send to contact"
          inside={<Octicons name="person" size={14} color={color.primary} />}
          onPress={requestContactsPermission}
        />
      )}
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
