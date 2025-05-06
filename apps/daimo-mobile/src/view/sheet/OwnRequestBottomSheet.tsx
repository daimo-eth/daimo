import {
  DaimoRequestState,
  DaimoRequestV2Status,
  decodeRequestIdString,
  dollarsToAmount,
  now,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { DaimoNonce, DaimoNonceMetadata, DaimoNonceType } from "@daimo/userop";
import { useContext, useEffect, useMemo } from "react";
import { ActivityIndicator, View } from "react-native";

import { DispatcherContext } from "../../action/dispatch";
import { useSendWithDeviceKeyAsync } from "../../action/useSendAsync";
import { useNav } from "../../common/nav";
import { env } from "../../env";
import { i18n } from "../../i18n";
import { useAccount } from "../../logic/accountManager";
import { eAccToContact } from "../../logic/daimoContacts";
import { AccountRow } from "../shared/AccountRow";
import { TitleAmount } from "../shared/Amount";
import { ButtonMed } from "../shared/Button";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { TextBodyCaps, TextCenter } from "../shared/text";
import { useTheme } from "../style/theme";

const i18 = i18n.ownRequestBottom;

// Bottom sheet for request made by the user
export function OwnRequestBottomSheet({
  reqStatus,
}: {
  reqStatus: DaimoRequestV2Status;
}) {
  const { color, ss } = useTheme();
  const account = useAccount();
  const nav = useNav();
  const dispatcher = useContext(DispatcherContext);

  // Generate nonce
  const nonce = useMemo(
    () =>
      new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.RequestResponse)),
    []
  );

  const { status, exec: onCancel } = useSendWithDeviceKeyAsync({
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

  const chainConfig = env(daimoChainFromId(account.homeChainId)).chainConfig;
  const coinName = chainConfig.tokenSymbol.toUpperCase();
  const chainName = chainConfig.chainL2.name.toUpperCase();

  return (
    <View style={ss.container.padH16}>
      <ScreenHeader
        title={i18.sheetHeader()}
        onExit={() => {
          dispatcher.dispatch({ name: "hideBottomSheet" });
        }}
        hideOfflineHeader
      />
      <TitleAmount amount={dollarsToAmount(reqStatus.link.dollars)} />
      <Spacer h={8} />
      <TextCenter>
        <TextBodyCaps color={color.grayMid}>
          {coinName} • {chainName}
        </TextBodyCaps>
      </TextCenter>
      {reqStatus.memo && (
        <>
          <Spacer h={16} />
          <TextCenter>
            <TextBodyCaps color={color.grayMid}>{reqStatus.memo}</TextBodyCaps>
          </TextCenter>
        </>
      )}
      <Spacer h={32} />
      {reqStatus.expectedFulfiller && (
        <AccountRow
          contact={eAccToContact(reqStatus.expectedFulfiller)}
          timestamp={reqStatus.createdAt}
          viewAccount={undefined}
        />
      )}
      <Spacer h={32} />
      {status === "idle" && (
        <ButtonMed
          title={i18.cancelButton()}
          onPress={onCancel}
          type="subtle"
          showBiometricIcon
        />
      )}
      {status === "loading" && <ActivityIndicator size="large" />}
      <Spacer h={48} />
    </View>
  );
}
