import { Octicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BarCodeScannedCallback, BarCodeScanner } from "expo-barcode-scanner";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { useSendPayment } from "../../action/useSendPayment";
import { assert } from "../../logic/assert";
import { parseDaimoLink } from "../../logic/link";
import {
  Recipient,
  getRecipient,
  useRecipientSearch,
} from "../../logic/recipient";
import { useAccount } from "../../model/account";
import { ButtonBig, ButtonSmall } from "../shared/Button";
import { Header } from "../shared/Header";
import { AmountInput, InputBig } from "../shared/Input";
import { HomeStackParamList, useNav } from "../shared/nav";
import { ss } from "../shared/style";
import { TextBody, TextCenter, TextError, TextSmall } from "../shared/text";

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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    BarCodeScanner.requestPermissionsAsync()
      .then(({ status }) => setHasPermission(status === "granted"))
      .catch((e) => console.error(e));
  }, []);

  const [handled, setHandled] = useState(false);
  const nav = useNav();

  const handleBarCodeScanned: BarCodeScannedCallback = async ({ data }) => {
    if (handled) return;

    const daimoLink = parseDaimoLink(data);
    if (daimoLink == null) return;
    setHandled(true);

    switch (daimoLink.type) {
      case "receive": {
        const recipient = await getRecipient(daimoLink.addr);
        nav.navigate("Send", { recipient });
        break;
      }
      default:
        throw new Error(`Unhandled daimo link type: ${daimoLink.type}`);
    }
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
    <View>
      <View style={ss.spacer.h64} />
      <View style={styles.headerRow}>
        <View style={ss.spacer.w32} />
        <TextSmall>{title}</TextSmall>
        <ButtonSmall onPress={hide}>
          <Octicons name="x" size={16} color="gray" />
        </ButtonSmall>
      </View>
    </View>
  );
}

function Search() {
  const [prefix, setPrefix] = useState("");
  const res = useRecipientSearch(prefix.trim().toLowerCase());

  return (
    <>
      <InputBig icon="search" value={prefix} onChange={setPrefix} />
      {res.error && <ErrorRow error={res.error} />}
      {res.recipients.map((r) => (
        <RecipientRow key={r.addr} recipient={r} />
      ))}
      {res.isSearching && res.recipients.length === 0 && (
        <TextCenter>
          <TextSmall>No results</TextSmall>
        </TextCenter>
      )}
    </>
  );
}

function ErrorRow({ error }: { error: { message: string } }) {
  return (
    <TextError>
      <TextCenter>{error.message}</TextCenter>
    </TextError>
  );
}

function RecipientRow({ recipient }: { recipient: Recipient }) {
  const nav = useNav();
  const pay = useCallback(() => nav.setParams({ recipient }), []);
  return <ButtonBig title={recipient.name} onPress={pay} />;
}

function SendPayment({ recipient }: { recipient: Recipient }) {
  const [dollars, setDollars] = useState(0);

  const nav = useNav();
  const hide = useCallback(() => nav.setParams({ recipient: undefined }), []);

  const [account] = useAccount();
  assert(account != null);

  const { status, message, exec } = useSendPayment(
    account.enclaveKeyName,
    recipient.addr,
    dollars
  );

  // TODO: load estimated fees
  const fees = 0.05;
  const totalDollars = dollars + fees;

  const statusMessage = (function (): ReactNode {
    switch (status) {
      case "idle":
        if (dollars === 0) return null;
        return `Total incl. fees $${totalDollars.toFixed(2)}`;
      case "loading":
        return message;
      case "error":
        return <TextError>{message}</TextError>;
      default:
        return null;
    }
  })();

  const button = (function () {
    switch (status) {
      case "idle":
        return (
          <ButtonBig
            title={`Send to ${recipient.name}`}
            onPress={exec}
            type="primary"
            disabled={dollars === 0}
          />
        );
      case "loading":
        return <ActivityIndicator size="large" />;
      case "success":
        return <ButtonBig title="Success" disabled />;
      case "error":
        return <ButtonBig title="Error" disabled />;
    }
  })();

  return (
    <>
      <CancelRow title={`Sending to ${recipient.name}`} hide={hide} />
      <View style={ss.spacer.h32} />
      <AmountInput value={dollars} onChange={setDollars} />
      <View style={ss.spacer.h32} />
      {button}
      <TextSmall>
        <TextCenter>{statusMessage}</TextCenter>
      </TextSmall>
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
    width: "100%",
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
  },
});
