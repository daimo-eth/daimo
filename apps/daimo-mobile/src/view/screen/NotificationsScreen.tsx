import { DaimoRequestV2Info } from "@daimo/common";
import { useMemo } from "react";
import { ScrollView, View } from "react-native";

import { useNav } from "../../common/nav";
import { EAccountContact } from "../../logic/daimoContacts";
import { Account } from "../../model/account";
import { ButtonSmall } from "../shared/Button";
import { ContactBubble } from "../shared/ContactBubble";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { ss } from "../shared/style";
import { TextBody, TextCenter } from "../shared/text";
import { useWithAccount } from "../shared/withAccount";

export function NotificationsScreen() {
  const Inner = useWithAccount(NotificationsScreenInner);
  return <Inner />;
}

function NotificationsScreenInner({ account }: { account: Account }) {
  const nav = useNav();

  const goBack = () => {
    nav.goBack();
  };

  const requestsList = account.requests.slice();

  return (
    <View style={ss.container.screen}>
      <ScreenHeader title="Notifications" onBack={goBack} />
      <ScrollView>
        {requestsList.length === 0 ? (
          <View>
            <Spacer h={48} />
            <TextCenter>
              <TextBody color="#777777">No notifications to display</TextBody>
            </TextCenter>
          </View>
        ) : (
          <>
            <View
              style={[
                ss.container.marginHNeg16,
                ss.container.padH16,
                { height: 0.5, backgroundColor: "#D6D6D6" },
              ]}
            />
            {requestsList.map((request) => (
              <NotificationRow key={request.id} {...request} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function NotificationRow(props: DaimoRequestV2Info) {
  const { type, request, fulfiller } = props;

  const contact = useMemo(() => {
    const account = type === "fulfiller" ? request.recipient : fulfiller;
    return { type: "eAcc", ...account } as EAccountContact;
  }, [type, request, fulfiller]);

  return (
    <View
      style={[
        ss.container.marginHNeg16,
        ss.container.padH16,
        {
          paddingTop: 16,
          paddingBottom: 28,
          flexDirection: "row",
          borderBottomWidth: 0.5,
          borderBottomColor: "#D6D6D6",
        },
      ]}
    >
      <ContactBubble contact={contact} size={36} />
      <Spacer w={16} />
      <View style={{ flex: 1 }}>
        <NotificationMessage {...props} />
        <Spacer h={2} />
        <TextBody color="#777777">5d ago</TextBody>
        <Spacer h={8} />
        <NotificationActions {...props} />
      </View>
    </View>
  );
}

function NotificationActions(props: DaimoRequestV2Info) {
  const { type, request, fulfiller } = props;

  const handleCancel = () => {
    // Create trpc route handler
  };

  const handleDecline = () => {
    // Soft-delete request from requests list.
  };

  const handleAccept = () => {
    // Create trpc route handler
  };

  if (type === "recipient") {
    return (
      <View>
        <ButtonSmall type="subtle" title="Cancel" />
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row" }}>
      <View style={{ flex: 1 }}>
        <ButtonSmall type="subtle" title="Decline" />
      </View>
      <Spacer w={16} />
      <View style={{ flex: 1 }}>
        <ButtonSmall type="primary" title="Send" />
      </View>
    </View>
  );
}

function NotificationMessage(info: DaimoRequestV2Info) {
  if (info.type === "recipient") {
    return (
      <TextBody color="#777777">
        You requested{" "}
        <TextBody color="#000000">${info.request.link.dollars}</TextBody> from{" "}
        <TextBody color="#000000">{info.fulfiller.name}</TextBody>
      </TextBody>
    );
  }

  return (
    <TextBody color="#777777">
      <TextBody color="#000000">{info.request.recipient.name}</TextBody>{" "}
      requested{" "}
      <TextBody color="#000000">${info.request.link.dollars}</TextBody> USDC
    </TextBody>
  );
}
