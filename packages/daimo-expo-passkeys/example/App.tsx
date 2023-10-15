import * as ExpoPasskeys from "daimo-expo-passkeys";
import { useState } from "react";
import { Button, Text, StyleSheet, View } from "react-native";

export default function App() {
  const accountName = "coco2";
  const challenge = "dGVzdA==";
  const [returnData, setReturnData] = useState<string>("");

  const onClickCreate = async () => {
    const ret = await ExpoPasskeys.createPasskey(accountName, challenge);
    setReturnData(JSON.stringify(ret));
    console.log("create", ret);
  };

  const onClickSign = async () => {
    const ret = await ExpoPasskeys.signWithPasskey(challenge);
    setReturnData(JSON.stringify(ret));
    console.log("sign", ret);
  };

  return (
    <View style={styles.container}>
      <Text>Hello world</Text>
      <Button title="Create Passkey" onPress={onClickCreate} />
      <Button title="Sign with Passkey" onPress={onClickSign} />
      <Text>{returnData}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
