import * as ExpoEnclave from "expo-enclave";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button, TextInput } from "react-native";

export default function App() {
  const [account, setAccount] = useState<string>("testdaimo");
  const [pubkey, setPubkey] = useState<string | undefined>("");
  const [signature, setSignature] = useState<string>("");
  const [verification, setVerification] = useState<boolean>(false);
  const [hardwareSecurityLevel, setHardwareSecurityLevel] =
    useState<ExpoEnclave.HardwareSecurityLevel>("SOFTWARE");
  const [biometricSecurityLevel, setBiometricSecurityLevel] =
    useState<ExpoEnclave.BiometricSecurityLevel>("NONE");

  (async () => {
    setHardwareSecurityLevel(await ExpoEnclave.getHardwareSecurityLevel());
    setBiometricSecurityLevel(await ExpoEnclave.getBiometricSecurityLevel());
  })();

  return (
    <View style={styles.container}>
      <Text>
        hardware security level: {hardwareSecurityLevel}, biometrics security
        level: {biometricSecurityLevel}
      </Text>
      <TextInput onChangeText={setAccount} value={account} />
      <Button
        title="Create"
        onPress={() => {
          ExpoEnclave.createKeyPair(account).catch((e) => {
            console.log("error already exists?", account, e);
          });
        }}
      />
      <Button
        title="Fetch Public key"
        onPress={async () => {
          setPubkey(await ExpoEnclave.fetchPublicKey(account));
        }}
      />
      <Text>
        {account} fetched key is {pubkey}
      </Text>
      <Button
        title="Sign Message"
        onPress={async () => {
          setSignature(await ExpoEnclave.sign(account, "deadbeef"));
        }}
      />
      <Text>Created signature is {signature} for message deadbeef</Text>
      <Button
        title="Verify signature"
        onPress={async () => {
          setVerification(
            await ExpoEnclave.verify(account, signature, "deadbeef")
          );
        }}
      />
      <Text>Verification result is {verification.toString()}</Text>
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
