import { Octicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BarCodeScannedCallback, BarCodeScanner } from "expo-barcode-scanner";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { Recipient, useRecipientSearch } from "../../logic/search";
import { ButtonBig, ButtonSmall } from "../shared/Button";
import { Header } from "../shared/Header";
import { AmountInput, InputBig } from "../shared/Input";
import { HomeStackParamList, useNav } from "../shared/nav";
import { ss } from "../shared/style";
import { TextBody, TextBold, TextSmall } from "../shared/text";

type Props = NativeStackScreenProps<HomeStackParamList, "Send">;

export default function SendScreen({ route }: Props) {
  const { recipient } = route.params || {};

  const [showScan, setShowScan] = useState(false);
  const scan = useCallback(() => setShowScan(true), []);
  const hideScan = useCallback(() => setShowScan(false), []);

  return (
    <View style={ss.container.outerStretch}>
      <Header />
      <ScrollView contentContainerStyle={styles.vertMain} bounces={false}>
        {recipient && <SendPayment recipient={recipient} />}
        {!recipient && showScan && <Scan hide={hideScan} />}
        {!recipient && !showScan && <ButtonSmall title="Scan" onPress={scan} />}
        {!recipient && !showScan && <Search />}
      </ScrollView>
      {/** TODO: Create Note */}
    </View>
  );
}

function Scan({ hide }: { hide: () => void }) {
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    BarCodeScanner.requestPermissionsAsync()
      .then(({ status }) => setHasPermission(status === "granted"))
      .catch((e) => console.error(e));
  }, []);

  const handleBarCodeScanned: BarCodeScannedCallback = ({ data }) => {
    // TODO: if data is a daimo:// link, then navigate to that
    alert(data);
  };

  let body: ReactNode;
  if (hasPermission === null) {
    body = <TextBody>Requesting for camera permission</TextBody>;
  } else if (hasPermission === false) {
    body = <TextBody>No access to camera</TextBody>;
  } else {
    body = (
      <View style={styles.cameraBox}>
        <BarCodeScanner
          onBarCodeScanned={handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
          barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
        />
      </View>
    );
  }

  return (
    <>
      <CancelRow title="Scan to pay" hide={hide} />
      {body}
    </>
  );
}

function CancelRow({ title, hide }: { title: string; hide: () => void }) {
  return (
    <View style={styles.headerRow}>
      <TextBold>{title}</TextBold>
      <ButtonSmall onPress={hide}>
        <Octicons name="x" size={16} color="gray" />
      </ButtonSmall>
    </View>
  );
}

function Search() {
  const [prefix, setPrefix] = useState("");
  const results = useRecipientSearch(prefix.trim().toLowerCase());

  return (
    <>
      <InputBig icon="search" value={prefix} onChange={setPrefix} />
      {results.map((r) => (
        <Result key={r.account.addr} recipient={r} />
      ))}
    </>
  );
}

function Result({ recipient }: { recipient: Recipient }) {
  const nav = useNav();
  const pay = useCallback(() => nav.setParams({ recipient }), []);
  return <ButtonBig title={recipient.account.name} onPress={pay} />;
}

function SendPayment({ recipient }: { recipient: Recipient }) {
  const [amount, setAmount] = useState(0);

  const nav = useNav();
  const hide = useCallback(() => nav.setParams({ recipient: undefined }), []);

  const send = useCallback(() => {
    console.log("TODO send");
  }, []);

  return (
    <>
      <CancelRow title={`Sending to ${recipient.account.name}`} hide={hide} />
      <AmountInput value={amount} onChange={setAmount} />
      <ButtonBig title="Send" onPress={send} />
      <TextSmall>TODO show fees</TextSmall>
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingLeft: 8,
  },
  vertMain: {
    alignSelf: "stretch",
    flexDirection: "column",
    paddingTop: 8,
    gap: 16,
  },
  cameraBox: {
    width: 300,
    height: 300,
  },
});
