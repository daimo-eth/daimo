import { validateName } from "@daimo/common";
import { DaimoChain } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { OnboardingHeader } from "./OnboardingHeader";
import {
  ParamListOnboarding,
  useExitBack,
  useOnboardingNav,
} from "../../../common/nav";
import {
  getAccountManager,
  useDaimoChain,
} from "../../../logic/accountManager";
import { env } from "../../../logic/env";
import { ButtonBig } from "../../shared/Button";
import { InputBig, OctName } from "../../shared/InputBig";
import { IntroTextParagraph } from "../../shared/IntroTextParagraph";
import Spacer from "../../shared/Spacer";
import { color } from "../../shared/style";
import { TextCenter, TextLight } from "../../shared/text";

type Props = NativeStackScreenProps<ParamListOnboarding, "CreatePickName">;
export function OnboardingPickNameScreen({ route }: Props) {
  const daimoChain = useDaimoChain();
  const [name, setName] = useState("");

  const nav = useOnboardingNav();
  const createAccount = useCallback(async () => {
    const { inviteLink } = route.params;
    // Kick off account creation in background
    getAccountManager().createAccount(name, inviteLink);
    // Request notifications permission, hiding latency
    nav.navigate("AllowNotifs");
  }, [route.params, name]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View>
        <OnboardingHeader title="Create Account" onPrev={useExitBack()} />
        <View style={styles.createAccountPage}>
          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <Octicons name="person" size={40} color={color.midnight} />
          </View>
          <Spacer h={24} />
          <TextCenter>
            <IntroTextParagraph>
              Your username is what you'll go by on Daimo. Choose wisely — once
              you get a name, you can't change it.
            </IntroTextParagraph>
          </TextCenter>
          <Spacer h={64} />
          <View style={styles.namePickerWrap}>
            <NamePicker
              name={name}
              daimoChain={daimoChain}
              onChange={setName}
              onChoose={createAccount}
            />
          </View>
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
      return <>{oct("alert")} sorry, that username is taken</>; // name taken
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
      <Spacer h={16} />
      <TextCenter>
        <TextLight>{status}</TextLight>
      </TextCenter>
      <Spacer h={16} />
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
    paddingTop: 36,
    paddingHorizontal: 24,
  },
});
