import * as ExpoEnclave from "expo-enclave";
import { useState } from "react";
import { StyleSheet, Text, View, Button, TextInput } from "react-native";

export default function App() {
  const [account, setAccount] = useState<string>("testdaimo");
  const [pubkey, setPubkey] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [verification, setVerification] = useState<boolean>(false);

  return (
    <View style={styles.container}>
      <TextInput onChangeText={setAccount} value={account} />
      <Button
        title="Create"
        onPress={() => {
          ExpoEnclave.createKeyPair(account);
        }}
      />
      <Button
        title="Fetch Public key"
        onPress={() => {
          setPubkey(ExpoEnclave.fetchPublicKey(account));
        }}
      />
      <Text>
        {account} fetched key is {pubkey}
      </Text>
      <Button
        title="Sign Message"
        onPress={() => {
          setSignature(ExpoEnclave.sign(account, "deadbeef"));
        }}
      />
      <Text>Created signature is {signature} for message deadbeef</Text>
      <Button
        title="Verify signature"
        onPress={() => {
          setVerification(ExpoEnclave.verify(account, signature, "deadbeef"));
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
