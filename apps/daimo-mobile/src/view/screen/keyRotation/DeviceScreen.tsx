import {
  OpStatus,
  assert,
  dollarsToAmount,
  formatFeeAmountOrNull,
  getSlotLabel,
  guessTimestampFromNum,
  now,
  timeString,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import {
  DaimoNonce,
  DaimoNonceMetadata,
  DaimoNonceType,
  DaimoOpSender,
} from "@daimo/userop";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ReactNode, useCallback, useEffect, useMemo } from "react";
import { ActivityIndicator, Alert, View } from "react-native";

import { useSendWithDeviceKeyAsync } from "../../../action/useSendAsync";
import { ParamListSettings, useNav } from "../../../common/nav";
import { i18NLocale, i18n } from "../../../i18n";
import { getAccountManager, useAccount } from "../../../logic/accountManager";
import { ButtonBig } from "../../shared/Button";
import { InfoBox } from "../../shared/InfoBox";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import {
  TextBody,
  TextCenter,
  TextError,
  TextH3,
  TextLight,
} from "../../shared/text";
import { useTheme } from "../../style/theme";

type Props = NativeStackScreenProps<ParamListSettings, "Device">;
const i18 = i18n.device;

export function DeviceScreen({ route, navigation }: Props) {
  const { color, ss } = useTheme();

  const account = useAccount();
  const nav = useNav();

  const { pubKey: devicePubkey } = route.params;
  const device = account?.accountKeys?.find((k) => k.pubKey === devicePubkey);

  const deviceName = device ? getSlotLabel(device.slot) : "Deleted device";

  useEffect(() => {
    navigation.setOptions({ title: deviceName });
  }, [navigation, deviceName]);

  const nonce = useMemo(
    () => new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.RemoveKey)),
    [devicePubkey]
  );

  const sendFn = async (opSender: DaimoOpSender) => {
    assert(device != null && account != null);
    console.log(`[ACTION] removing device ${device.slot}`);
    return opSender.removeSigningKey(device.slot, {
      nonce,
      chainGasConstants: account.chainGasConstants,
    });
  };

  const { status, message, cost, exec } = useSendWithDeviceKeyAsync({
    dollarsToSend: 0,
    sendFn,
    pendingOp: {
      type: "keyRotation",
      status: OpStatus.pending,
      slot: device?.slot || -1, // -1 is only used for "Deleted device", which is not a real slot
      rotationType: "remove",
      timestamp: now(),
    },
    accountTransform: (acc, pendingOp) => {
      assert(pendingOp.type === "keyRotation");
      return {
        ...acc,
        pendingKeyRotation: [...acc.pendingKeyRotation, pendingOp],
      };
    },
  });

  const removeDevice = useCallback(() => {
    const title = isOnlyDevice
      ? i18.confirmation.titleDeleteAccount()
      : i18.confirmation.titleRemoveDevice(deviceName);
    const msg = isOnlyDevice
      ? i18.confirmation.msgDeleteAccount()
      : i18.confirmation.msgDeleteAccount();
    Alert.alert(title, msg, [
      {
        text: i18.confirmation.remove(),
        onPress: () => {
          console.log(`[DEVICE] removing device ${deviceName} ${devicePubkey}`);
          exec();
        },
      },
      {
        text: i18.confirmation.cancel(),
        style: "cancel",
      },
    ]);
  }, []);

  // If we removed the device key, go back to settings.
  // If we removed this device's key onchain, delete it locally and log out.
  useEffect(() => {
    if (status !== "success" || !account) return;
    if (devicePubkey !== account.enclavePubKey) {
      nav.navigate("SettingsTab", { screen: "Settings" });
      return;
    }

    getAccountManager().deleteAccountAndKey();
  }, [status]);

  if (!account || !device) return null;

  const isCurrentDevice = devicePubkey === account?.enclavePubKey;
  const isOnlyDevice = account.accountKeys.length === 1;
  const canRemove =
    !isOnlyDevice ||
    account.lastBalance < dollarsToAmount(1) ||
    account.homeChainId === 84532; // Testnet

  const statusMessage = (function (): ReactNode {
    switch (status) {
      case "idle":
        if (canRemove) {
          return formatFeeAmountOrNull(i18NLocale, cost.totalDollars);
        } else {
          return i18.current.cannotRemove();
        }
      case "loading":
        return message;
      case "error":
        return <TextError>{message}</TextError>;
      default:
        return null;
    }
  })();

  const button = (function () {
    switch (status) {
      case "idle":
        return (
          <ButtonBig
            type="danger"
            title={i18.confirmation.remove()}
            onPress={removeDevice}
            disabled={!canRemove}
            showBiometricIcon
          />
        );
      case "loading":
        return <ActivityIndicator size="large" />;
      case "success":
        return <ButtonBig type="success" title="Success" disabled />;
      case "error":
        return <ButtonBig type="danger" title="Error" disabled />;
    }
  })();

  const addedAtS = guessTimestampFromNum(
    device.addedAt,
    daimoChainFromId(account.homeChainId)
  );

  const goBack = () => nav.goBack();

  return (
    <View style={ss.container.screen}>
      <ScreenHeader title={deviceName} onBack={goBack} />
      <Spacer h={16} />

      <View style={ss.container.padH16}>
        <TextH3>{deviceName}</TextH3>
        <Spacer h={8} />
        <TextBody color={color.grayMid}>Added {timeString(addedAtS)}</TextBody>
      </View>

      <Spacer h={32} />
      {isCurrentDevice && (
        <InfoBox
          title={
            isOnlyDevice ? i18.current.deleteTitle() : i18.current.usingTitle()
          }
          subtitle={
            isOnlyDevice
              ? i18.current.deleteSubtitle()
              : i18.current.usingSubtitle()
          }
        />
      )}
      <Spacer h={64} />
      {button}
      <Spacer h={8} />
      <TextCenter>
        <TextLight>{statusMessage}</TextLight>
      </TextCenter>
    </View>
  );
}
