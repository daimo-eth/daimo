import { useContext } from "react";
import { View } from "react-native";

import { AddressCopier } from "./DepositAddressBottomSheet";
import { DispatcherContext } from "../../action/dispatch";
import { useNav } from "../../common/nav";
import { i18n } from "../../i18n";
import { useAccount } from "../../logic/accountManager";
import { QRCodeBox } from "../screen/QRScreen";
import { ButtonMed } from "../shared/Button";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { TextLight, TextPara } from "../shared/text";
import { useWithAccount } from "../shared/withAccount";
import { useTheme } from "../style/theme";

const TRON_URL = "https://tronscan.org/#/address/";
const i18 = i18n.deposit.tron;

export function TronBottomSheet() {
  const Inner = useWithAccount(TronBottomSheetInner);
  return <Inner />;
}

export function TronBottomSheetInner() {
  const account = useAccount();
  const { ss, color } = useTheme();
  const nav = useNav();

  const dispatcher = useContext(DispatcherContext);

  // Check if there's an existing receiving address for Tron
  const tronAddress = account?.receivingAddresses?.find(
    (r) => r.type === "tron"
  );
  if (!account) return <View />;

  const createTronAddress = async () => {
    console.log(`[TRON] creating tron receiving address for ${account.name}`);
    dispatcher.dispatch({ name: "hideBottomSheet" });
    nav.navigate("DepositTab", {
      screen: "LandlineWebView",
      // TODO: add params
    });
  };

  const goKyc = () => {
    nav.navigate("DepositTab", {
      screen: "LandlineWebView",
      // TODO: add url params
    });
  };

  // If there's no tron address, surface a creation flow
  if (tronAddress == null) {
    return (
      <View style={ss.container.padH24}>
        <ScreenHeader
          title={i18.cta()}
          onExit={() => {
            dispatcher.dispatch({ name: "hideBottomSheet" });
          }}
          hideOfflineHeader
        />
        <Spacer h={16} />
        <ButtonMed
          type="primary"
          title={i18.createAddress()}
          onPress={createTronAddress}
        />
        <Spacer h={16} />
        <TextLight style={{ textAlign: "center" }}>
          {i18.createDescription()}
        </TextLight>
        <Spacer h={8} />
        <TextLight style={{ textAlign: "center" }}>
          {i18.kycDescription()}
        </TextLight>
        <Spacer h={48} />
      </View>
    );
  }

  // Otherwise, surface the address
  const needsKyc = tronAddress.status === "needs-kyc";
  const tronQr = TRON_URL + tronAddress.address;
  return (
    <View style={ss.container.padH24}>
      <ScreenHeader
        title={i18.cta()}
        onExit={() => {
          dispatcher.dispatch({ name: "hideBottomSheet" });
        }}
        hideOfflineHeader
      />
      <Spacer h={16} />
      <TextPara color={color.grayDark}>{i18.description()}</TextPara>
      <Spacer h={12} />
      <AddressCopier
        addr="TLxALstEyL93MgdXGBNGXHeEUfbqqgfJFY"
        disabled={needsKyc}
      />
      {needsKyc ? (
        <>
          <ButtonMed type="primary" title={i18.kycRequired()} onPress={goKyc} />
          <Spacer h={12} />
          <TextLight style={{ textAlign: "center" }}>
            {i18.kycRequiredDescription()}
          </TextLight>
        </>
      ) : (
        <>
          <QRCodeBox
            value={tronQr}
            logoURI="https://assets.coingecko.com/coins/images/32884/large/USDT.PNG"
          />
          <Spacer h={16} />
          <TextLight>{i18.addressDescription()}</TextLight>
        </>
      )}
      <Spacer h={48} />
    </View>
  );
}
