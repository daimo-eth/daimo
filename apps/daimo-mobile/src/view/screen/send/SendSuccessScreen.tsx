import { fullDateAndTime } from "@daimo/common";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef } from "react";
import { View } from "react-native";

import { AmountChooser } from "../../shared/AmountInput";
import { AnimatedCheck, AnimatedCheckRef } from "../../shared/AnimatedCheck";
import { ButtonBig } from "../../shared/Button";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { ParamListSend, navResetToHome, useNav } from "../../shared/nav";
import { ss } from "../../shared/style";
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

  const noop = useCallback(() => {}, []);

  const nowS = useRef(Date.now() / 1000).current;
  const { day, time } = fullDateAndTime(nowS);

  if (!recipient) return null;

  return (
    <View style={ss.container.padH16}>
      <ScreenHeader title="Successful transfer" onExit={onExit} />
      <Spacer h={32} />
      <AnimatedCheck ref={checkRef} />
      <Spacer h={32} />
      <AmountChooser
        dollars={nDollars}
        onSetDollars={noop}
        disabled
        showAmountAvailable={false}
        autoFocus={false}
        lagAutoFocus={false}
      />
      <TextCenter>
        <TextLight>Sent to </TextLight>
        <TextBody>{recipient?.name || recipient?.ensName}</TextBody>
      </TextCenter>
      <Spacer h={6} />
      <TextCenter>
        <TextLight>
          on {day} at {time}
        </TextLight>
      </TextCenter>
      <Spacer h={48} />
      <View style={ss.container.padH8}>
        <ButtonBig title="FINISH" onPress={onExit} type="primary" />
        <Spacer h={16} />
        <ButtonBig
          title="MAKE ANOTHER TRANSFER"
          onPress={onBack}
          type="subtle"
        />
      </View>
    </View>
  );
}
