import {
  StatusAPIResponse,
  createAppClient,
  viemConnector,
} from "@daimo/auth-client";
import { useEffect, useState } from "react";
import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { Account } from "../../model/account";
import { ButtonMed } from "../shared/Button";
import Spacer from "../shared/Spacer";
import { ErrorRowCentered } from "../shared/error";
import { ss } from "../shared/style";
import { TextH3, TextLight } from "../shared/text";
import { useWithAccount } from "../shared/withAccount";

// Connect Farcaster
export function FarcasterBottomSheet() {
  const Inner = useWithAccount(FarcasterBottomSheetInner);
  return <Inner />;
}

const appClient = createAppClient({
  relay: "https://relay.farcaster.xyz",
  ethereum: viemConnector({ rpcUrl: "https://mainnet.optimism.io" }),
});

function FarcasterBottomSheetInner({ account }: { account: Account }) {
  // Farcaster AuthKit broken, unusuable in React Native
  // const { signIn, url, data, error } = useSignIn({
  //   nonce: account?.address,
  // });

  const nonce = account.address.substring(2);

  // Use a fork of underlying auth-client instead
  const [error, setError] = useState<Error>();
  const [url, setUrl] = useState<string>();
  const [data, setData] = useState<StatusAPIResponse>();

  // Open a channel; poll for status
  useEffect(() => {
    (async () => {
      console.log(`[FARCASTER] opening login channel, nonce ${nonce}`);
      const resp = await appClient.createChannel({
        domain: "daimo.com",
        siweUri: "https://daimo.com",
        nonce,
      });

      if (resp.isError) {
        console.error(`[FARCASTER] channel create error`, resp.error);
        setError(resp.error);
        return;
      }

      console.log(`[FARCASTER] got channel token ${resp.data.channelToken}`);
      const { channelToken, url } = resp.data;
      setUrl(url);

      const status = await appClient.watchStatus({ channelToken });
      if (status.isError) {
        console.error(`[FARCASTER] login failed`, status.error);
        setError(status.error);
      } else {
        console.error(`[FARCASTER] login success`, JSON.stringify(status.data));
        setData(status.data);
      }
    })();
  }, []);

  return (
    <View style={ss.container.screen}>
      <View style={ss.container.padH16}>
        <Spacer h={16} />
        <TextH3>Connect Farcaster</TextH3>
        <Spacer h={12} />
        {!error && !data && url == null && <TextLight>Loading...</TextLight>}
        {!error && !data && url != null && <QRCode value={url} />}
        {!error && data && <LinkFarcasterSection {...{ account, data }} />}
        {error && <ErrorRowCentered error={error} />}
      </View>
    </View>
  );
}

function LinkFarcasterSection({
  account,
  data,
}: {
  account: Account;
  data: StatusAPIResponse;
}) {
  console.log("[FARCASTER] got data: " + JSON.stringify(data));

  const linkFC = () => {
    console.log("[FARCASTER] TODO link farcaster");
  };

  return (
    <View>
      <TextH3>Connected! Welcome @{data.username}</TextH3>
      <Spacer h={16} />
      <ButtonMed type="primary" title="Link" onPress={linkFC} />
    </View>
  );
}

function useSignIn() {}
