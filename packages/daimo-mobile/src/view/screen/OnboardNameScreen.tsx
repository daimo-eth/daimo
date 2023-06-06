import { StyleSheet, View } from "react-native";

import { useCallback, useState } from "react";
import { ButtonBig } from "../shared/Button";
import { Header } from "../shared/Header";
import { InputBig } from "../shared/Input";
import { TextBody, TextH1, TextSmall } from "../shared/text";
import { ss } from "../shared/style";

export default function OnboardNameScreen() {
  const [name, setName] = useState("");
  // const result = useNameLookup(name);

  const create = useCallback(() => {
    console.log(`TODO: CREATE`);
  }, []);

  return (
    <View style={ss.container.outerStretch}>
      <Header />
      <View style={styles.vertMain}>
        <TextH1>Welcome</TextH1>
        <TextBody>Choose a name</TextBody>
        <InputBig placeholder="enter name" value={name} onChange={setName} />
        <TextSmall>TODO status</TextSmall>
        <ButtonBig title="Create" onPress={create} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  vertMain: {
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 32,
    gap: 32,
  },
  vertQR: {
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  horzButtons: {
    flexDirection: "row",
    gap: 24,
  },
});
