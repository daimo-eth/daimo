import {
  DaimoRequestState,
  DaimoRequestV2Status,
  decodeRequestIdString,
  dollarsToAmount,
  now,
} from "@daimo/common";
import { DaimoNonce, DaimoNonceMetadata, DaimoNonceType } from "@daimo/userop";
import { useContext, useEffect, useMemo } from "react";
import { ActivityIndicator, View } from "react-native";

import { DispatcherContext } from "../../action/dispatch";
import { useSendAsync } from "../../action/useSendAsync";
import { useNav } from "../../common/nav";
import { useAccount } from "../../logic/accountManager";
import { AccountRow } from "../shared/AccountRow";
import { TitleAmount } from "../shared/Amount";
import { ButtonMed } from "../shared/Button";
import Spacer from "../shared/Spacer";
import { color, ss } from "../shared/style";
import { TextCenter, TextH3 } from "../shared/text";

// Bottom sheet for request made by the user
export function OwnRequestBottomSheet({
  reqStatus,
}: {
  reqStatus: DaimoRequestV2Status;
}) {
  const [account] = useAccount();
  const nav = useNav();
  const dispatcher = useContext(DispatcherContext);

  // Generate nonce
  const nonce = useMemo(
    () =>
      new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.RequestResponse)),
    []
  );

  const { status, exec: onCancel } = useSendAsync({
    dollarsToSend: 0,
    sendFn: async (opSender) => {
      console.log(
        `[ACTION] cancelling request ${reqStatus.link.id.toString()}`
      );
      return opSender.cancelRequest(decodeRequestIdString(reqStatus.link.id), {
        nonce,
        chainGasConstants: account!.chainGasConstants,
      });
    },
    accountTransform: (acc) => {
      const updatedRequest = {
        ...reqStatus,
        status: DaimoRequestState.Cancelled,
        updatedAt: now(),
      };
      return {
        ...acc,
        notificationRequestStatuses: acc.notificationRequestStatuses // Replace old request with updated one
          .filter((req) => req.link.id !== reqStatus.link.id)
          .concat([updatedRequest]),
      };
    },
  });

  useEffect(() => {
    if (status === "success") {
      dispatcher.dispatch({ name: "hideBottomSheet" });
      nav.navigate("HomeTab", { screen: "Home" });
    }
  }, [status]);

  if (!account) return null;

  return (
    <View style={ss.container.padH16}>
      <Spacer h={16} />
      <TextCenter>
        <TextH3>Requested</TextH3>
      </TextCenter>
      <Spacer h={24} />
      <TitleAmount
        amount={dollarsToAmount(reqStatus.link.dollars)}
        style={{ color: color.success }}
      />
      <Spacer h={24} />
      {reqStatus.expectedFulfiller && (
        <AccountRow
          acc={reqStatus.expectedFulfiller}
          timestamp={reqStatus.createdAt}
          viewAccount={undefined}
        />
      )}
      <Spacer h={32} />
      {status === "idle" && (
        <ButtonMed title="CANCEL REQUEST" onPress={onCancel} type="subtle" />
      )}
      {status === "loading" && <ActivityIndicator size="large" />}
      <Spacer h={48} />
    </View>
  );
}
