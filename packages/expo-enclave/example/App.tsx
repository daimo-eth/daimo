import * as ExpoEnclave from "expo-enclave";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button, TextInput } from "react-native";

export default function App() {
  const [account, setAccount] = useState<string>("testdaimo");
  const [pubkey, setPubkey] = useState<string | undefined>("");
  const [signature, setSignature] = useState<string>("");
  const [verification, setVerification] = useState<boolean>(false);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);

  (async () => {
    setIsAvailable(await ExpoEnclave.isSecureEnclaveAvailable());
  })();

  return (
    <View style={styles.container}>
      <Text>is secure enclave available? {isAvailable ? "Yes" : "No"}</Text>
      <TextInput onChangeText={setAccount} value={account} />
      <Button
        title="Create"
        onPress={() => {
          ExpoEnclave.createKeyPair(account);
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
