import * as ExpoEnclave from "@daimo/expo-enclave";
import {
  DaimoOpSender,
  DaimoNonce,
  DaimoNonceMetadata,
  DaimoNonceType,
  SigningCallback,
} from "@daimo/userop";
import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

export default function App() {
  const [account, setAccount] = useState<string>("testdaimo");
  const [pubkey, setPubkey] = useState<string | undefined>("");
  const [signature, setSignature] = useState<string>("");
  const [verification, setVerification] = useState<boolean>(false);
  const [hardwareSecurityLevel, setHardwareSecurityLevel] =
    useState<ExpoEnclave.HardwareSecurityLevel>("SOFTWARE");
  const [opHash, setOpHash] = useState<string>("");

  const promptCopy: ExpoEnclave.PromptCopy = {
    usageMessage: "Authorise transaction",
    androidTitle: "Sign tx",
  };

  (async () => {
    setHardwareSecurityLevel(await ExpoEnclave.getHardwareSecurityLevel());
  })();

  const testTx = async () => {
    const accName = "testdaimo123";
    const accAddress = "0x4E8FBb345Ba703c84D29c4D531f23CFb3BBCc14d";
    const derPublicKey = (await ExpoEnclave.fetchPublicKey(accName)) as string;
    const signer: SigningCallback = async (message) => {
      const signature = await ExpoEnclave.sign(accName, message, promptCopy);
      return {
        derSig: signature,
        keySlot: 0,
      };
    };
    console.log(
      "P-256 Public Key, deploy corresponding account by calling createAccount on factory:",
      derPublicKey
    );
    const account = await DaimoOpSender.initFromEnv(accAddress, signer);
    console.log(
      "account, give it some eth + usdc magically:",
      account.getAddress()
    );

    const nonce = new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.Send));
    const opHash = await account.erc20transfer(
      "0xF05b5f04B7a77Ca549C0dE06beaF257f40C66FDB",
      "42",
      {
        nonce,
        chainGasConstants: {
          maxPriorityFeePerGas: "1000000",
          maxFeePerGas: "100000050",
          estimatedFee: 0.1,
        },
      }
    );
    setOpHash(opHash ?? "failed");
  };

  return (
    <View style={styles.container}>
      <Text>hardware security level: {hardwareSecurityLevel}</Text>
      <TextInput onChangeText={setAccount} value={account} />
      <Button
        title="Create"
        onPress={() => {
          ExpoEnclave.createKeyPair(account).catch((e: any) => {
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
          setSignature(await ExpoEnclave.sign(account, "deadbeef", promptCopy));
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
      <Button title="Test Tx" onPress={testTx} />
      <Text>
        Test op hash is
        {opHash}
      </Text>
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
