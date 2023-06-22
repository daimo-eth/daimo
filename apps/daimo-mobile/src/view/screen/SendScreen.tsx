import { tokenMetadata } from "@daimo/contract";
import { DaimoAccount } from "@daimo/userop";
import { Octicons } from "@expo/vector-icons";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BarCodeScannedCallback, BarCodeScanner } from "expo-barcode-scanner";
import { ReactNode, useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { Hex, parseUnits } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

import { useSendAsync } from "../../action/useSendAsync";
import { assert, assertNotNull } from "../../logic/assert";
import { ChainContext } from "../../logic/chain";
import { parseDaimoLink } from "../../logic/link";
import { useAvailMessagingApps } from "../../logic/messagingApps";
import { fetchNotesContractAllowance } from "../../logic/note";
import {
  Recipient,
  getRecipient,
  useRecipientSearch,
} from "../../logic/recipient";
import { useAccount } from "../../model/account";
import { TitleAmount } from "../shared/Amount";
import { ButtonBig, ButtonSmall } from "../shared/Button";
import { Header } from "../shared/Header";
import { AmountInput, InputBig } from "../shared/Input";
import { HomeStackParamList, useNav } from "../shared/nav";
import { ss } from "../shared/style";
import {
  TextBody,
  TextCenter,
  TextError,
  TextH2,
  TextSmall,
} from "../shared/text";

type Props = NativeStackScreenProps<HomeStackParamList, "Send">;

type SendTab = "search" | "scan" | "createNote";

// Work around

export default function SendScreen({ route }: Props) {
  const { recipient, dollars } = route.params || {};

  const [tab, setTab] = useState<SendTab>("search");
  const [tabs] = useState(["Search", "Scan"]);
  const createNote = useCallback(() => setTab("createNote"), []);
  const search = useCallback(() => setTab("search"), []);
  const setSegmentVal = useCallback(
    (v: string) => setTab(v.toLowerCase() as SendTab),
    []
  );

  const [, sendViaAppStr] = useAvailMessagingApps();

  return (
    <View style={ss.container.outerStretch}>
      <Header />
      <ScrollView contentContainerStyle={styles.vertMain} bounces={false}>
        {recipient && <SetAmount recipient={recipient} dollars={dollars} />}
        {!recipient && (
          <>
            {tab !== "createNote" && (
              <SegmentedControl
                values={tabs}
                selectedIndex={tab === "scan" ? 1 : 0}
                onValueChange={setSegmentVal}
                fontStyle={{ fontSize: 16 }}
                activeFontStyle={{ fontSize: 16 }}
                style={{ height: 40 }}
              />
            )}
            {tab !== "createNote" && <View style={ss.spacer.h16} />}
            {tab === "search" && <Search />}
            {tab === "scan" && <Scan hide={search} />}
            {tab === "createNote" && <CreateNote hide={search} />}
          </>
        )}
      </ScrollView>
      {!recipient && tab === "search" && (
        <View style={ss.container.ph16}>
          <ButtonBig title="Create Note" onPress={createNote} />
          <View style={ss.spacer.h16} />
          <TextSmall>{sendViaAppStr}</TextSmall>
        </View>
      )}
      {recipient && dollars && (
        <SendButton recipient={recipient} dollars={dollars} />
      )}
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
      <CancelRow hide={hide}>Scan to pay</CancelRow>
      <View style={ss.spacer.h8} />
      {body}
    </>
  );
}

function CancelRow({
  children,
  hide,
}: {
  children: ReactNode;
  hide: () => void;
}) {
  return (
    <ButtonSmall onPress={hide}>
      <View style={styles.cancelRow}>
        <View style={ss.spacer.w8} />
        <TextSmall>{children}</TextSmall>
        <Octicons name="x" size={20} color="gray" />
      </View>
    </ButtonSmall>
  );
}

function Search() {
  const [prefix, setPrefix] = useState("");
  const res = useRecipientSearch(prefix.trim().toLowerCase());

  return (
    <View style={styles.vertSearch}>
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
    </View>
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

function SetAmount({
  recipient,
  dollars,
}: {
  recipient: Recipient;
  dollars?: number;
}) {
  const nav = useNav();
  const hide = () =>
    nav.setParams({ recipient: undefined, dollars: undefined });
  const clearDollars = () => nav.setParams({ dollars: undefined });

  // Temporary dollar amount while typing
  const [d, setD] = useState(0);
  const submit = () => {
    nav.setParams({ dollars: d });
    setD(0);
  };

  // Exact amount in token units
  const amount = parseUnits(`${dollars || 0}`, tokenMetadata.decimals);

  return (
    <>
      <View style={ss.spacer.h128} />
      <CancelRow hide={hide}>
        <TextCenter>
          Sending to{"\n"}
          <TextH2>{recipient.name}</TextH2>
        </TextCenter>
      </CancelRow>
      <View style={ss.spacer.h32} />
      {dollars == null && (
        <View style={ss.container.ph16}>
          <AmountInput value={d} onChange={setD} onSubmitEditing={submit} />
        </View>
      )}
      {dollars != null && (
        <ButtonSmall onPress={clearDollars}>
          <TextCenter>
            <TitleAmount amount={amount} />
          </TextCenter>
        </ButtonSmall>
      )}
    </>
  );
}

function SendButton({
  recipient,
  dollars,
}: {
  recipient: Recipient;
  dollars: number;
}) {
  const [account] = useAccount();
  assert(account != null);

  const { status, message, exec } = useSendAsync(
    account.enclaveKeyName,
    async (account: DaimoAccount) => {
      console.log(`[ACTION] sending $${dollars} to ${recipient.addr}`);
      return account.erc20transfer(recipient.addr, `${dollars}`);
    }
  );

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

  return (
    <View style={ss.container.ph16}>
      {button}
      <View style={ss.spacer.h16} />
      <TextSmall>
        <TextCenter>{statusMessage}</TextCenter>
      </TextSmall>
    </View>
  );
}

function CreateNote({ hide }: { hide: () => void }) {
  const [ephemeralPrivateKey, setEphemeralPrivateKey] = useState<Hex>("0x");

  const { chain } = useContext(ChainContext);
  const { clientL2 } = assertNotNull(chain);

  const [dollars, setDollars] = useState(0);

  const [account] = useAccount();
  assert(account != null);
  const { address } = account;

  const [isNotesContractApproved, setIsNotesContractApproved] = useState(false);

  useEffect(() => {
    (async () => {
      const allowance = await fetchNotesContractAllowance(clientL2, address);
      setIsNotesContractApproved(allowance > 0);

      const privKey = generatePrivateKey();
      setEphemeralPrivateKey(privKey);
    })();
  }, []);

  const { status, message, exec } = useSendAsync(
    account.enclaveKeyName,
    async (account: DaimoAccount) => {
      const ephemeralOwner = privateKeyToAccount(ephemeralPrivateKey).address;
      return account.createEphemeralNote(
        ephemeralOwner,
        `${dollars}`,
        !isNotesContractApproved
      );
    }
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
            title="Create note"
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

  useEffect(() => {
    (async () => {
      if (status !== "success") return;
      // TODO: We can optimistically do this on loading rather than wait
      // for success.
      try {
        const result = await Share.share({
          message: `${account.name} paid you $${dollars}. Claim your money: daimo://note?ephemeralPrivateKey=${ephemeralPrivateKey}`,
          url: `daimo://note?ephemeralPrivateKey=${ephemeralPrivateKey}`,
        });
        if (result.action === Share.sharedAction) {
          console.log(
            "[APP] Note shared with activity type ",
            result.activityType || "unknown"
          );
        } else if (result.action === Share.dismissedAction) {
          // Only on iOS
          console.log("[APP] Note share reverted");
          // TODO: Suggest revert or retry?
        }
      } catch (error: any) {
        console.error("[APP] Note share error:", error);
      }
    })();
  }, [status]);

  return (
    <>
      <CancelRow hide={hide}>Creating note</CancelRow>
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
  cancelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 8,
  },
  vertMain: {
    flexDirection: "column",
    alignSelf: "stretch",
    paddingTop: 8,
  },
  vertSearch: {
    flexDirection: "column",
    alignSelf: "stretch",
    gap: 8,
  },
  cameraBox: {
    width: "100%",
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
  },
});
