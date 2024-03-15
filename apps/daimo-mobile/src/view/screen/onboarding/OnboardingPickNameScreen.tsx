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
import { TextBody, TextCenter } from "../../shared/text";

type Props = NativeStackScreenProps<ParamListOnboarding, "CreatePickName">;
export function OnboardingPickNameScreen({ route }: Props) {
  const daimoChain = useDaimoChain();
  const [name, setName] = useState("");
  const { inviteLink } = route.params;

  const nav = useOnboardingNav();
  const createAccount = useCallback(async () => {
    // Kick off account creation in background
    getAccountManager().createAccount(name, inviteLink);
    // Request notifications permission, hiding latency
    nav.navigate("AllowNotifs");
  }, [inviteLink, name]);

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
              Your username is public on Daimo.
            </IntroTextParagraph>
          </TextCenter>
          <Spacer h={24} />
          <IconRow
            icon="check-circle"
            color={color.successDark}
            title={`valid ${
              inviteLink.type === "notev2" ? "payment link" : "invite"
            }`}
          />
          <Spacer h={8} />
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

function IconRow(props: { icon: OctName; color?: string; title: string }) {
  const { icon, title } = props;
  const col = props.color || color.grayMid;
  return (
    <View style={styles.iconRow}>
      <Octicons {...{ name: icon, size: 16, color: col }} />
      <TextBody color={col}>{title}</TextBody>
    </View>
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
  const status = (function () {
    if (name.length === 0 || debounce) {
      return <IconRow icon="circle" color={color.grayMid} title="pick name" />;
    } else if (error) {
      return <IconRow icon="alert" title={error.toLowerCase()} />;
    } else if (result.isLoading) {
      return <IconRow icon="circle" color={color.grayMid} title="..." />;
    } else if (result.error) {
      return <IconRow icon="alert" title="offline?" />;
    } else if (result.isSuccess && result.data) {
      return <IconRow icon="alert" title="sorry, that name is taken" />;
    } else if (result.isSuccess && result.data === null) {
      isAvailable = true;
      return (
        <IconRow
          icon="check-circle"
          color={color.successDark}
          title="username available"
        />
      );
    }
    throw new Error("unreachable");
  })();

  return (
    <View>
      {status}
      <Spacer h={24} />
      <InputBig
        placeholder="choose a username"
        value={name}
        onChange={onChange}
        center
        autoFocus
      />
      <Spacer h={24} />
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
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 99,
    backgroundColor: color.ivoryLight,
  },
});
