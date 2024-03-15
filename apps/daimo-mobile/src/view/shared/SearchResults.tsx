import { now, timeAgo } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import * as Contacts from "expo-contacts";
import { useCallback } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  View,
} from "react-native";

import { ButtonMed } from "./Button";
import { Bubble, ContactBubble } from "./ContactBubble";
import { LinkedAccountBubble } from "./LinkedAccountBubble";
import Spacer from "./Spacer";
import { ErrorRowCentered } from "./error";
import { color, touchHighlightUnderlay } from "./style";
import { TextBody, TextCenter, TextLight } from "./text";
import { useWithAccount } from "./withAccount";
import { navToAccountPage, useNav } from "../../common/nav";
import {
  DaimoContact,
  EAccountContact,
  getContactName,
  getDaimoContactKey,
  useRecipientSearch,
} from "../../logic/daimoContacts";
import { ContactsAccess } from "../../logic/systemContacts";
import { Account } from "../../model/account";
import { useKeyboardHeight } from "../../vendor/useKeyboardHeight";

export function SearchResults({
  contactsAccess,
  prefix,
  mode,
}: {
  contactsAccess: ContactsAccess;
  prefix: string;
  mode: "send" | "account" | "receive";
}) {
  const Inner = useWithAccount(SearchResultsScroll);
  return (
    <Inner prefix={prefix.trim().toLowerCase()} {...{ mode, contactsAccess }} />
  );
}

function SearchResultsScroll({
  account,
  contactsAccess,
  prefix,
  mode,
}: {
  contactsAccess: ContactsAccess;
  account: Account;
  prefix: string;
  mode: "send" | "account" | "receive";
}) {
  const { permission: contactsPermission, ask: requestContactsPermission } =
    contactsAccess;

  const res = useRecipientSearch(
    account,
    prefix,
    contactsPermission?.granted || false,
    mode === "receive"
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
          mode={mode}
        />
      )}
      {res.recipients.length > 0 && (
        <View style={styles.resultsHeader}>
          <TextLight>{recentsOnly ? "Recents" : "Search results"}</TextLight>
        </View>
      )}
      {res.recipients.map((r) => (
        <RecipientRow key={getDaimoContactKey(r)} recipient={r} mode={mode} />
      ))}
      {res.status === "success" &&
        res.recipients.length === 0 &&
        prefix !== "" && <NoSearchResults />}
      <Spacer h={32} />
      {Platform.OS === "ios" && <Spacer h={kbH} />}
    </ScrollView>
  );
}

function NoSearchResults() {
  const nav = useNav();
  const sendPaymentLink = () =>
    nav.navigate("SendTab", {
      screen: "SendLink",
      params: {},
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
}: {
  recipient: DaimoContact;
  mode: "send" | "account" | "receive";
}) {
  const name = getContactName(recipient);
  const nav = useNav();
  const goToAccount = useCallback(() => {
    switch (recipient.type) {
      case "email":
      case "phoneNumber": {
        nav.navigate("SendTab", {
          screen: "SendLink",
          params: { recipient },
        });
        return;
      }
      case "eAcc": {
        if (mode === "account") {
          navToAccountPage(recipient, nav);
        } else if (mode === "send") {
          nav.navigate("SendTab", {
            screen: "SendTransfer",
            params: { recipient },
          });
        } else {
          nav.navigate("HomeTab", {
            screen: "Receive",
            params: { autoFocus: true, recipient },
          });
        }
      }
    }
  }, [name, mode]);

  const lightText = (function () {
    switch (recipient.type) {
      case "email":
        return recipient.name ? recipient.email : undefined;
      case "phoneNumber":
        return recipient.name ? recipient.phoneNumber : undefined;
      case "eAcc": {
        const nowS = now();
        const { lastSendTime, lastRecvTime } = recipient;
        if (lastSendTime) return `Sent ${timeAgo(lastSendTime, nowS, true)}`;
        if (lastRecvTime)
          return `Received ${timeAgo(lastRecvTime, nowS, true)}`;
        return undefined;
      }
    }
  })();
  const shortenedLightText =
    lightText && lightText?.length > 17
      ? lightText.slice(0, 16) + "…"
      : lightText;

  return (
    <Row onPress={goToAccount}>
      <View style={styles.resultRow}>
        <View style={styles.resultAccount}>
          <ContactBubble contact={recipient} size={36} />
          <View style={{ flexDirection: "column" }}>
            <TextBody>{name}</TextBody>
            {recipient.type === "eAcc" && (
              <>
                <Spacer h={2} />
                <ProfileLinks recipient={recipient} />
              </>
            )}
          </View>
        </View>
        <TextLight>{shortenedLightText}</TextLight>
      </View>
    </Row>
  );
}

function ProfileLinks({ recipient }: { recipient: EAccountContact }) {
  const links = recipient.linkedAccounts || [];
  return (
    <View style={{ flexDirection: "row" }}>
      {links.map((link, index) => (
        <LinkedAccountBubble key={index} acc={link} />
      ))}
    </View>
  );
}

function ExtraRows({
  contactsPermission,
  requestContactsPermission,
  mode,
}: {
  contactsPermission: Contacts.PermissionResponse;
  requestContactsPermission: () => void;
  mode: "send" | "receive" | "account";
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
        title={mode === "receive" ? "Receive via link" : "Send via link"}
        inside={<Octicons name="link" size={14} color={color.primary} />}
        onPress={() => {
          if (mode === "receive") {
            nav.navigate("HomeTab", {
              screen: "Receive",
              params: { autoFocus: true },
            });
          } else {
            nav.navigate("SendTab", {
              screen: "SendLink",
              params: {},
            });
          }
        }}
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
    height: 64,
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
