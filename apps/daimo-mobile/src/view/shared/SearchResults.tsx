import { now, timeAgo } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Contacts from "expo-contacts";
import { useCallback } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  View,
} from "react-native";

import { Bubble, ContactBubble } from "./Bubble";
import { ButtonMed } from "./Button";
import { LinkedAccountBubble } from "./LinkedAccountBubble";
import Spacer from "./Spacer";
import { ErrorRowCentered } from "./error";
import { TextBody, TextCenter, TextLight } from "./text";
import { useWithAccount } from "./withAccount";
import { navToAccountPage, useNav } from "../../common/nav";
import { i18NLocale, i18n } from "../../i18n";
import {
  DaimoContact,
  EAccountContact,
  getContactName,
  getDaimoContactKey,
  useContactSearch,
} from "../../logic/daimoContacts";
import { ContactsAccess } from "../../logic/systemContacts";
import { Account } from "../../storage/account";
import { useKeyboardHeight } from "../../vendor/useKeyboardHeight";
import { useTheme } from "../style/theme";

const i18 = i18n.searchResults;

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

  const res = useContactSearch(
    account,
    prefix,
    contactsPermission?.granted || false,
    mode === "receive"
  );

  const recentsOnly = prefix === "";

  const kbH = useKeyboardHeight() - useBottomTabBarHeight();

  return (
    <ScrollView
      contentContainerStyle={styles.resultsScroll}
      keyboardShouldPersistTaps="handled"
      style={styles.scrollView}
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
          <TextLight>
            {recentsOnly
              ? i18n.viewShared.recents()
              : i18n.viewShared.searchResults()}
          </TextLight>
        </View>
      )}
      {res.recipients.map((r) => (
        <ContactNav key={getDaimoContactKey(r)} contact={r} mode={mode} />
      ))}
      {res.status === "success" &&
        res.recipients.length === 0 &&
        prefix !== "" && <NoSearchResults />}
      <Spacer h={64} />
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
        <TextLight>{i18.noResults()}</TextLight>
      </TextCenter>
      <Spacer h={32} />
      <ButtonMed
        type="subtle"
        title={i18.paymentLinkButton()}
        onPress={sendPaymentLink}
      />
    </View>
  );
}

function ContactNav({
  contact,
  mode,
}: {
  contact: DaimoContact;
  mode: "send" | "account" | "receive";
}) {
  const name = getContactName(contact);
  const nav = useNav();
  const goToAccount = useCallback(() => {
    switch (contact.type) {
      case "email":
      case "phoneNumber": {
        if (mode === "receive") {
          nav.navigate("HomeTab", {
            screen: "Receive",
            params: { fulfiller: contact, autoFocus: true },
          });
        } else {
          nav.navigate("SendTab", {
            screen: "SendLink",
            params: { recipient: contact },
          });
        }
        return;
      }
      case "eAcc": {
        if (mode === "account") {
          navToAccountPage(contact, nav);
        } else if (mode === "send") {
          nav.navigate("SendTab", {
            screen: "SendTransfer",
            params: { recipient: contact },
          });
        } else {
          nav.navigate("HomeTab", {
            screen: "Receive",
            params: { autoFocus: true, fulfiller: contact },
          });
        }
      }
    }
  }, [name, mode]);

  return <SearchResultRow contact={contact} onPress={goToAccount} />;
}

export function SearchResultRow({
  contact,
  onPress,
}: {
  contact: DaimoContact;
  onPress: () => void;
}) {
  const name = getContactName(contact);

  const lightText = (function () {
    switch (contact.type) {
      case "email":
        return contact.name ? contact.email : undefined;
      case "phoneNumber":
        return contact.name ? contact.phoneNumber : undefined;
      case "eAcc": {
        const nowS = now();
        const { lastSendTime, lastRecvTime } = contact;
        const lastSendMessage = lastSendTime
          ? `${i18.sentAgo(timeAgo(lastSendTime, i18NLocale, nowS, true))}`
          : undefined;
        const lastRecvMessage = lastRecvTime
          ? `${i18.receivedAgo(timeAgo(lastRecvTime, i18NLocale, nowS, true))}`
          : undefined;

        if ((lastSendTime || 0) > (lastRecvTime || 0)) {
          return lastSendMessage;
        } else return lastRecvMessage;
      }
    }
  })();
  const shortenedLightText =
    lightText && lightText?.length > 17
      ? lightText.slice(0, 16) + "…"
      : lightText;

  return (
    <Row onPress={onPress}>
      <View style={styles.resultRow}>
        <View style={styles.resultAccount}>
          <ContactBubble contact={contact} size={36} />
          <View style={{ flexDirection: "column" }}>
            <TextBody>{name}</TextBody>
            {contact.type === "eAcc" && (
              <>
                <Spacer h={2} />
                <ProfileLinks contact={contact} />
              </>
            )}
          </View>
        </View>
        <TextLight>{shortenedLightText}</TextLight>
      </View>
    </Row>
  );
}

function ProfileLinks({ contact }: { contact: EAccountContact }) {
  const links = contact.linkedAccounts || [];
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
  const { color } = useTheme();
  const nav = useNav();

  return (
    <>
      {!contactsPermission.granted && mode !== "receive" && (
        <ExtraRow
          title={i18.extra.contact()}
          inside={<Octicons name="person" size={14} color={color.primary} />}
          onPress={requestContactsPermission}
        />
      )}
      <ExtraRow
        title={
          mode === "receive" ? i18.extra.requestLink() : i18.extra.sendLink()
        }
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
        title={mode === "receive" ? i18.extra.showQR() : i18.extra.scanQR()}
        inside={<Octicons name="apps" size={14} color={color.primary} />}
        onPress={() => {
          if (mode === "receive") {
            nav.navigate("HomeTab", {
              screen: "QR",
              params: { option: "PayMe" },
            });
          } else {
            nav.navigate("SendTab", {
              screen: "QR",
              params: { option: "Scan" },
            });
          }
        }}
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
  const { touchHighlightUnderlay } = useTheme();
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
  scrollView: {
    height: "100%",
  },
});
