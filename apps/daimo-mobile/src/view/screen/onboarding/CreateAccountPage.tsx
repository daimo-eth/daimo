import { validateName } from "@daimo/common";
import { DaimoChain } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import { useCallback, useEffect, useState } from "react";
import {
  Keyboard,
  TouchableWithoutFeedback,
  View,
  StyleSheet,
} from "react-native";

import { OnboardingHeader } from "./OnboardingHeader";
import { ActStatus } from "../../../action/actStatus";
import { env } from "../../../logic/env";
import { ButtonBig } from "../../shared/Button";
import { InputBig, OctName } from "../../shared/InputBig";
import Spacer from "../../shared/Spacer";
import { color } from "../../shared/style";
import {
  EmojiToOcticon,
  TextCenter,
  TextError,
  TextLight,
} from "../../shared/text";

export function CreateAccountPage({
  onNext,
  onPrev,
  name,
  setName,
  daimoChain,
  exec,
  status,
  message,
}: {
  onNext: () => void;
  onPrev?: () => void;
  name: string;
  setName: (name: string) => void;
  daimoChain: DaimoChain;
  exec: () => void;
  status: ActStatus;
  message: string;
}) {
  const createAccount = useCallback(() => {
    if (status === "idle") {
      exec();
      console.log(`[ONBOARDING] create account ${name} ${status} ${message}`);
      onNext();
    }
  }, [exec]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View>
        <OnboardingHeader title="Create Account" onPrev={onPrev} />
        <View style={styles.createAccountPage}>
          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <Octicons name="person" size={40} color={color.midnight} />
          </View>
          <Spacer h={32} />
          <View style={styles.namePickerWrap}>
            {status === "idle" && (
              <NamePicker
                name={name}
                daimoChain={daimoChain}
                onChange={setName}
                onChoose={createAccount}
              />
            )}
          </View>
          <TextCenter>
            {status === "error" && <TextError>{message}</TextError>}
            {status !== "error" && (
              <TextLight>
                <EmojiToOcticon size={16} text={message} />
              </TextLight>
            )}
          </TextCenter>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

function NamePicker({
  name,
  daimoChain,
  onChange,
  onChoose,
}: {
  name: string;
  daimoChain: DaimoChain;
  onChange: (name: string) => void;
  onChoose: () => void;
}) {
  let error = "";
  try {
    validateName(name);
  } catch (e: any) {
    error = e.message;
  }
  const rpcHook = env(daimoChain).rpcHook;
  const result = rpcHook.resolveName.useQuery({ name }, { enabled: !error });

  const [debounce, setDebounce] = useState(false);
  useEffect(() => {
    setDebounce(true);
    const t = setTimeout(() => setDebounce(false), 500);
    return () => clearTimeout(t);
  }, [name]);

  let isAvailable = false;
  const oct = (name: OctName, color?: string) => (
    <Octicons {...{ name, color }} size={14} />
  );
  const status = (function () {
    if (name.length === 0 || debounce) {
      return " "; // no error
    } else if (error) {
      return (
        <>
          {oct("alert")} {error.toLowerCase()}
        </>
      ); // invalid name
    } else if (result.isLoading) {
      return "..."; // name valid, loading
    } else if (result.error) {
      return <>{oct("alert")} offline?</>; // name valid, other error
    } else if (result.isSuccess && result.data) {
      return <>{oct("alert")} sorry, that name is taken</>; // name taken
    } else if (result.isSuccess && result.data === null) {
      isAvailable = true; // name valid & available
      return <>{oct("check-circle", color.successDark)} available</>;
    }
    throw new Error("unreachable");
  })();

  return (
    <View>
      <InputBig
        placeholder="choose a username"
        value={name}
        onChange={onChange}
        center
        autoFocus
      />
      <Spacer h={8} />
      <TextCenter>
        <TextLight>{status}</TextLight>
      </TextCenter>
      <Spacer h={8} />
      <ButtonBig
        type="primary"
        title="Create"
        onPress={onChoose}
        disabled={!isAvailable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  namePickerWrap: {
    height: 168,
  },
  createAccountPage: {
    paddingTop: 96,
    paddingHorizontal: 24,
  },
});
