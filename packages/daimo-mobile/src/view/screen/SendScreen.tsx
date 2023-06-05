import { ScrollView, StyleSheet, View } from "react-native";

import { Octicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { BarCodeScannedCallback, BarCodeScanner } from "expo-barcode-scanner";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { Recipient, useRecipientSearch } from "../../logic/search";
import { HomeStackParamList } from "../HomeStack";
import { ButtonBig, ButtonMed } from "../shared/Button";
import { Header } from "../shared/Header";
import { InputBig } from "../shared/Input";
import { TextBody } from "../shared/text";

export default function SendScreen() {
  const [showScan, setShowScan] = useState(false);
  const scan = useCallback(() => setShowScan(true), []);
  const hideScan = useCallback(() => setShowScan(false), []);
  return (
    <View style={styles.outerView}>
      <Header />
      <View style={styles.vertMain}>
        {showScan && <Scan hide={hideScan} />}
        {!showScan && <ButtonMed title="Scan" onPress={scan} />}
        {!showScan && <Search />}
      </View>
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
      <BarCodeScanner
        onBarCodeScanned={handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
        barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
      />
    );
  }

  return (
    <>
      <View style={styles.headerRow}>
        <ButtonMed onPress={hide}>
          <Octicons name="x" size={16} color="gray" />
        </ButtonMed>
      </View>
      {body}
    </>
  );
}

function Search() {
  const [prefix, setPrefix] = useState("");
  const results = useRecipientSearch(prefix);

  return (
    <ScrollView>
      <InputBig icon="search" value={prefix} onChange={setPrefix} />
      {results.map((r) => (
        <Result recipient={r} />
      ))}
    </ScrollView>
  );
}

function Result({ recipient }: { recipient: Recipient }) {
  const nav = useNavigation<StackNavigationProp<HomeStackParamList>>();
  const pay = useCallback(() => nav.setParams({ recipient }), []);
  return <ButtonBig title={recipient.account.name} onPress={pay} />;
}

const styles = StyleSheet.create({
  outerView: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  vertMain: {
    borderWidth: 1,
    borderColor: "#f00",
    alignSelf: "stretch",
    flexDirection: "column",
    alignItems: "flex-end",
    paddingTop: 8,
    gap: 16,
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
