import {
  OpStatus,
  assert,
  dollarsToAmount,
  getSlotLabel,
  guessTimestampFromNum,
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

import { useSendAsync } from "../../action/useSendAsync";
import { deleteEnclaveKey } from "../../logic/enclave";
import { useAccount } from "../../model/account";
import { getAmountText } from "../shared/Amount";
import { ButtonBig } from "../shared/Button";
import { InfoBox } from "../shared/InfoBox";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { ParamListSettings, useDisableTabSwipe, useNav } from "../shared/nav";
import { color, ss } from "../shared/style";
import {
  TextBody,
  TextCenter,
  TextError,
  TextH3,
  TextLight,
} from "../shared/text";

type Props = NativeStackScreenProps<ParamListSettings, "Device">;

export function DeviceScreen({ route, navigation }: Props) {
  const [account, setAccount] = useAccount();
  const nav = useNav();
  useDisableTabSwipe(nav);

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

  const { status, message, cost, exec } = useSendAsync({
    dollarsToSend: 0,
    sendFn,
    pendingOp: {
      type: "keyRotation",
      status: OpStatus.pending,
      slot: device!.slot,
      rotationType: "remove",
      timestamp: Date.now() / 1e3,
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
    Alert.alert(
      "Remove " + deviceName + "\n",
      `Are you sure you want to remove this device?`,
      [
        {
          text: `Remove ${deviceName}`,
          onPress: removeKey,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );

    async function removeKey() {
      console.log(`[DEVICE] Removing device ${devicePubkey}`);
      exec();
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (status !== "success" || !account) return;
      const { enclaveKeyName, enclavePubKey } = account;

      if (devicePubkey === enclavePubKey) {
        console.log(
          `[USER] deleted device key onchain; deleting locally ${enclaveKeyName}`
        );
        await deleteEnclaveKey(enclaveKeyName);

        setAccount(null);
        nav.navigate("HomeTab", { screen: "Home" });
      }
    })();
  }, [status]);

  if (!account || !device) return null;

  const isCurrentDevice = devicePubkey === account?.enclavePubKey;
  const canRemove =
    account.accountKeys.length > 1 ||
    account.lastBalance < dollarsToAmount(1) ||
    account.homeChainId === 84531; // Testnet

  const statusMessage = (function (): ReactNode {
    switch (status) {
      case "idle":
        if (canRemove) {
          return `Fee: ${getAmountText({ dollars: cost.totalDollars })}`;
        } else {
          return `This is your only device. Transfer your balance elsewhere before removing.`;
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
            title="Remove Device"
            onPress={removeDevice}
            disabled={!canRemove}
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
          title="You're using this device now"
          subtitle="Removing it from this account will log you out"
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
