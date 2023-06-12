import { DaimoAccount, SigningCallback } from "@daimo/userop";
import * as ExpoEnclave from "@daimo/expo-enclave";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  TextInput,
  Linking,
} from "react-native";

export default function App() {
  const [account, setAccount] = useState<string>("testdaimo");
  const [pubkey, setPubkey] = useState<string | undefined>("");
  const [signature, setSignature] = useState<string>("");
  const [verification, setVerification] = useState<boolean>(false);
  const [hardwareSecurityLevel, setHardwareSecurityLevel] =
    useState<ExpoEnclave.HardwareSecurityLevel>("SOFTWARE");
  const [biometricSecurityLevel, setBiometricSecurityLevel] =
    useState<ExpoEnclave.BiometricSecurityLevel>("NONE");
  const [txHash, setTxHash] = useState<string>("");

  const biometricPromptCopy: ExpoEnclave.BiometricPromptCopy = {
    usageMessage: "Authorise transaction",
    androidTitle: "Sign tx",
  };

  (async () => {
    setHardwareSecurityLevel(await ExpoEnclave.getHardwareSecurityLevel());
    setBiometricSecurityLevel(await ExpoEnclave.getBiometricSecurityLevel());
  })();

  const testTx = async () => {
    const accName = "testdaimo";
    const derPublicKey = (await ExpoEnclave.fetchPublicKey(accName)) as string;
    const signer: SigningCallback = async (message) => {
      // hex version of '\x19Ethereum Signed Message:\n32'
      const hexifiedPrefix =
        "19457468657265756d205369676e6564204d6573736167653a0a3332";
      const signature = await ExpoEnclave.sign(
        accName,
        hexifiedPrefix + message,
        biometricPromptCopy
      );
      return signature;
    };
    const account = await DaimoAccount.init(derPublicKey, signer, false);
    console.log(
      "account, give it some eth + usdc magically:",
      account.getAddress()
    );

    const hash = await account.erc20transfer(
      "0xd730c829ba97FFeB78Dd64c477D0bE671b2767Fe",
      "0xF05b5f04B7a77Ca549C0dE06beaF257f40C66FDB",
      "42"
    );
    setTxHash(hash ?? "failed");
  };

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
          setSignature(
            await ExpoEnclave.sign(account, "deadbeef", biometricPromptCopy)
          );
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
        Test tx hash is{" "}
        <Text
          style={{ color: "blue" }}
          onPress={() =>
            Linking.openURL(`https://goerli.basescan.org/tx/${txHash}`)
          }
        >
          {txHash}
        </Text>
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
