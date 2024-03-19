import {
  DaimoRequestV2Info,
  decodeRequestIdString,
  now,
  timeAgo,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { DaimoNonce, DaimoNonceMetadata, DaimoNonceType } from "@daimo/userop";
import { useEffect, useMemo } from "react";
import { Alert, ScrollView, View } from "react-native";

import { useSendAsync } from "../../action/useSendAsync";
import { useNav } from "../../common/nav";
import { getAccountManager } from "../../logic/accountManager";
import { EAccountContact } from "../../logic/daimoContacts";
import { env } from "../../logic/env";
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

  const requestsList = account.requests.slice();

  return (
    <View style={ss.container.screen}>
      <ScreenHeader title="Notifications" onBack={nav.goBack} />
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
              <NotificationRow
                key={request.request.link.id}
                {...request}
                account={account}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function NotificationRow(props: DaimoRequestV2Info & { account: Account }) {
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
        <TextBody color="#777777">
          {timeAgo(props.request.createdAt, now(), true)}
        </TextBody>
        <Spacer h={8} />
        <NotificationActions {...props} />
      </View>
    </View>
  );
}

function NotificationActions({
  type,
  request,
  account,
}: DaimoRequestV2Info & { account: Account }) {
  const nav = useNav();
  const { rpcFunc } = env(daimoChainFromId(account!.homeChainId));

  // Generate nonce
  const nonce = useMemo(
    () =>
      new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.RequestResponse)),
    []
  );

  const { status, exec } = useSendAsync({
    dollarsToSend: 0,
    sendFn: async (opSender) => {
      console.log(`[ACTION] cancelling request ${request.link.id.toString()}`);
      return opSender.cancelRequest(
        decodeRequestIdString(request.link.id),
        2, // RequestStatus.Cancelled
        { nonce, chainGasConstants: account.chainGasConstants }
      );
    },
    accountTransform: (acc) => {
      return {
        ...acc,
        requests: acc.requests.filter(
          (a) => a.request.link.id !== request.link.id
        ),
      };
    },
  });

  useEffect(() => {
    if (status === "success") {
      nav.navigate("Home");
    }
  }, [status]);

  const handleCancel = () => {
    Alert.alert(
      "Confirm cancel",
      "Proceed with request cancellation?",
      [{ text: "Yes", onPress: exec }, { text: "No" }],
      { cancelable: true }
    );
  };

  const onDeclinePress = () => {
    Alert.alert(
      "Confirm decline",
      "Proceed with declining request?",
      [{ text: "Yes", onPress: handleDecline }, { text: "No" }],
      { cancelable: true }
    );
  };

  const handleDecline = () => {
    getAccountManager().transform((acc) => ({
      ...acc,
      declinedRequestIDs: [...acc.declinedRequestIDs, request.link.id],
      requests: acc.requests.filter(
        (a) => a.request.link.id !== request.link.id
      ),
    }));

    rpcFunc.logAction.mutate({
      action: {
        accountName: account.name,
        name: "request-decline",
        keys: { "request.id": request.link.id },
      },
    });
  };

  const handleSend = () => {
    nav.navigate("SendTab", {
      screen: "SendTransfer",
      params: { link: request.link },
    });
  };

  if (type === "recipient") {
    return (
      <View>
        <ButtonSmall onPress={handleCancel} type="subtle" title="Cancel" />
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row" }}>
      <View style={{ flex: 1 }}>
        <ButtonSmall onPress={onDeclinePress} type="subtle" title="Decline" />
      </View>
      <Spacer w={16} />
      <View style={{ flex: 1 }}>
        <ButtonSmall onPress={handleSend} type="primary" title="Send" />
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
