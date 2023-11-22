import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

import { AmountChooser } from "../../shared/AmountInput";
import { AnimatedCheck, AnimatedCheckRef } from "../../shared/AnimatedCheck";
import { ButtonBig } from "../../shared/Button";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { ParamListSend, navResetToHome, useNav } from "../../shared/nav";
import { TextBody, TextCenter, TextLight } from "../../shared/text";

type Props = NativeStackScreenProps<ParamListSend, "SendSuccess">;

export function SendSuccessScreen({ route }: Props) {
  const { dollars, recipient } = route.params || {};
  const nav = useNav();
  const nDollars = parseFloat(dollars || "");
  const checkRef = useRef<AnimatedCheckRef>(null);

  useEffect(() => {
    checkRef?.current?.play();
  }, []);

  const onExit = () => navResetToHome(nav);
  const onBack = () =>
    nav.navigate("SendTab", {
      screen: "SendNav",
      params: { autoFocus: true },
    });

  const createDateString = () => {
    const date = new Date(
      recipient?.lastSendTime ? recipient?.lastSendTime * 1000 : Date.now()
    );
    const day = date.toLocaleString([], {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });

    const time = date.toLocaleString([], {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
    return `on ${day} at ${time}`;
  };

  return (
    <View style={styles.container}>
      <Spacer h={8} />
      <ScreenHeader title="Successful transfer" onExit={onExit} />
      <Spacer h={32} />
      <AnimatedCheck ref={checkRef} />
      <Spacer h={32} />
      <AmountChooser
        dollars={nDollars}
        onSetDollars={useCallback(() => {}, [])}
        disabled
        showAmountAvailable={false}
        autoFocus={false}
      />
      <TextCenter>
        <TextLight>Was send to </TextLight>
        <TextBody>{recipient?.name || recipient?.ensName}</TextBody>
      </TextCenter>
      <Spacer h={6} />
      <TextCenter>
        <TextLight>{createDateString()}</TextLight>
      </TextCenter>
      <Spacer h={48} />
      <ButtonBig title="FINISH" onPress={onExit} type="primary" />
      <Spacer h={16} />
      <ButtonBig title="MAKE ANOTHER TRANSFER" onPress={onBack} type="subtle" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
  },
});
