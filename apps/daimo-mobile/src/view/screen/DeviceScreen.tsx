import { assert } from "@daimo/common";
import {
  DaimoAccount,
  DaimoNonce,
  DaimoNonceMetadata,
  DaimoNonceType,
} from "@daimo/userop";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ReactNode, useCallback, useEffect, useMemo } from "react";
import { View, Alert, ActivityIndicator } from "react-native";

import { useSendAsync } from "../../action/useSendAsync";
import { pubKeyToEmoji } from "../../logic/device";
import { deleteEnclaveKey, useLoadKeyFromEnclave } from "../../logic/enclave";
import { guessTimestampFromNum, timeString } from "../../logic/time";
import { useAccount } from "../../model/account";
import { getAmountText } from "../shared/Amount";
import { ButtonBig } from "../shared/Button";
import Spacer from "../shared/Spacer";
import { HomeStackParamList, useNav } from "../shared/nav";
import { ss } from "../shared/style";
import {
  TextBody,
  TextCenter,
  TextError,
  TextH1,
  TextH2,
  TextLight,
} from "../shared/text";

type Props = NativeStackScreenProps<HomeStackParamList, "Device">;

export function DeviceScreen({ route, navigation }: Props) {
  // Load the latest version of this op. If the user opens the detail screen
  // while the op is pending, and it confirms, the screen should update.
  const [account, setAccount] = useAccount();
  assert(account != null);
  const nav = useNav();

  const selfPubkey = useLoadKeyFromEnclave(account.enclaveKeyName);

  const { pubKey: devicePubkey } = route.params;
  const device = account.accountKeys.find((k) => k.key === devicePubkey)!;

  const deviceName = "Device " + pubKeyToEmoji(device.key);

  useEffect(() => {
    navigation.setOptions({ title: deviceName });
  }, [navigation, deviceName]);

  const nonce = useMemo(
    () => new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.RemoveKey)),
    [devicePubkey]
  );

  const sendFn = async (account: DaimoAccount) => {
    console.log(`[ACTION] removing device ${devicePubkey}`);
    return account.removeSigningKey(devicePubkey, nonce);
  };

  const { status, message, cost, exec } = useSendAsync({
    enclaveKeyName: account.enclaveKeyName,
    dollarsToSend: 0,
    sendFn,
  });

  const removeDevice = useCallback(() => {
    const { enclaveKeyName } = account;

    Alert.alert(
      "Remove " + deviceName + "\n",
      `Are you sure you want to remove this device?\n\n` +
        `If this is the only device on your account, you'll lose your account.`,
      [
        {
          text: "Remove Device",
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

      if (devicePubkey === selfPubkey) {
        console.log(`[USER] deleting account; deleting key ${enclaveKeyName}`);
        await deleteEnclaveKey(enclaveKeyName);

        setAccount(null);
        nav.navigate("Home");
      }
    }
  }, []);

  const statusMessage = (function (): ReactNode {
    switch (status) {
      case "idle":
        return `Remove fee: ${getAmountText({ dollars: cost.totalDollars })}`;
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

  return (
    <View style={ss.container.vertModal}>
      <Spacer h={16} />
      <TextH1>{deviceName}</TextH1>
      <Spacer h={16} />
      {devicePubkey === selfPubkey && (
        <>
          <TextCenter>
            <TextH2>Current Device</TextH2>
          </TextCenter>
          <Spacer h={16} />
        </>
      )}
      <TextBody>
        <TextCenter>
          Added at {timeString(guessTimestampFromNum(device.addedAt))}
        </TextCenter>
      </TextBody>
      <Spacer h={16} />
      <TextCenter>Last used at unknown</TextCenter>
      <Spacer h={16} />
      {button}
      <Spacer h={16} />
      <TextCenter>
        <TextLight>
          <TextCenter>{statusMessage}</TextCenter>
        </TextLight>
      </TextCenter>
    </View>
  );
}
