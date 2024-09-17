import { assert, getSupportedSendPairs, SendPair } from "@daimo/common";
import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  DAv2Chain,
  ForeignToken,
  getChainDisplayName,
  getDAv2Chain,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy,
} from "@daimo/contract";
import { useEffect, useMemo, useRef } from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SelectDropdown from "react-native-select-dropdown";

import IconArbitrum from "../../../../assets/logos/arb-logo.png";
import IconBase from "../../../../assets/logos/base-logo.png";
import IconOptimism from "../../../../assets/logos/op-logo.png";
import IconPolygon from "../../../../assets/logos/poly-logo.png";
import { useAccount } from "../../../logic/accountManager";
import { TextBtnCaps } from "../../shared/text";
import { Colorway, SkinStyleSheet } from "../../style/skins";
import { useTheme } from "../../style/theme";

// Get the logo for the chain
// TODO: move elsewhere
const getChainUri = (chain: DAv2Chain) => {
  switch (chain) {
    case base:
    case baseSepolia:
    default:
      return IconBase;
    case optimism:
    case optimismSepolia:
      return IconOptimism;
    case polygon:
    case polygonAmoy:
      return IconPolygon;
    case arbitrum:
    case arbitrumSepolia:
      return IconArbitrum;
  }
};

export function SendCoinButton({
  toCoin,
  setCoin,
  autoFocus,
}: {
  toCoin: ForeignToken;
  setCoin: (coin: ForeignToken) => void;
  autoFocus?: boolean;
}) {
  const { color, ss } = useTheme();
  const styles = useMemo(() => getStyles(color, ss), [color, ss]);
  const account = useAccount();

  // Autofocus
  const ddRef = useRef<SelectDropdown>(null);
  useEffect(() => {
    if (autoFocus && ddRef.current) ddRef.current.openDropdown();
  }, []);

  if (account == null) return null;

  // Get home coin = default send coin + all other supported send coins
  const { homeChainId, homeCoinAddress } = account;
  const supportedSendPairs = getSupportedSendPairs(homeChainId);
  const homeCoin = supportedSendPairs
    .map((p) => p.coin)
    .find((c) => c.chainId === homeChainId && c.token === homeCoinAddress);
  assert(homeCoin != null, "home coin not a supported send coin");

  // Currently selected send coin
  const toChain = getDAv2Chain(toCoin.chainId);
  const chainUri = getChainUri(toChain);
  const onSetPair = (entry: SendPair) => setCoin(entry.coin);

  return (
    <SelectDropdown
      data={supportedSendPairs}
      defaultValue={homeCoin}
      onSelect={onSetPair}
      ref={ddRef}
      renderButton={() => (
        <View style={{ ...styles.coinButton, backgroundColor: color.white }}>
          <View style={styles.coinPickerWrap}>
            <SendPairImage coinUri={toCoin.logoURI} chainSource={chainUri} />
            <View style={styles.textContainer}>
              <TextBtnCaps color={color.grayDark}>{toCoin.symbol}</TextBtnCaps>
              <TextBtnCaps color={color.grayMid}>
                {getChainDisplayName(toChain, true, true)}
              </TextBtnCaps>
            </View>
          </View>
        </View>
      )}
      renderItem={(sendPair) => (
        <View>
          <CoinPickItem coin={sendPair.coin} chain={sendPair.chain} />
        </View>
      )}
      dropdownStyle={styles.coinDropdown}
    />
  );
}

function SendPairImage({
  coinUri,
  chainSource,
}: {
  coinUri: string | undefined;
  chainSource: ImageSourcePropType;
}) {
  const { color, ss } = useTheme();
  const styles = useMemo(() => getStyles(color, ss), [color, ss]);
  if (coinUri == null) return null;
  return (
    <View style={styles.sendPairContainer}>
      <Image source={{ uri: coinUri }} style={styles.coinImage} />
      <View style={styles.chainImageContainer}>
        <Image source={chainSource} style={styles.chainImage} />
      </View>
    </View>
  );
}

function CoinPickItem({
  coin,
  chain,
}: {
  coin: ForeignToken;
  chain: DAv2Chain;
}) {
  const { color, ss } = useTheme();
  const styles = useMemo(() => getStyles(color, ss), [color, ss]);
  const chainUri = getChainUri(chain);
  return (
    <View style={styles.coinPickItem}>
      <SendPairImage coinUri={coin.logoURI} chainSource={chainUri} />
      <View style={styles.textContainer}>
        <Text
          style={{
            ...ss.text.btnCaps,
            color: color.grayDark,
          }}
        >
          {coin.symbol}
        </Text>
        <Text
          style={{
            ...ss.text.btnCaps,
            color: color.grayMid,
          }}
        >
          {getChainDisplayName(chain, false, true)}
        </Text>
      </View>
    </View>
  );
}

export function CoinPellet({
  toCoin,
  onClick,
}: {
  toCoin: ForeignToken;
  onClick: () => void;
}) {
  const { color, ss } = useTheme();
  const styles = useMemo(() => getStyles(color, ss), [color, ss]);
  const toChain = getDAv2Chain(toCoin.chainId);
  const chainUri = getChainUri(toChain);
  return (
    <View style={{ ...styles.coinButton, backgroundColor: color.white }}>
      <Pressable onPress={onClick}>
        <View
          style={{ ...styles.coinPickerWrap, backgroundColor: color.white }}
        >
          <SendPairImage coinUri={toCoin.logoURI} chainSource={chainUri} />
          <Text
            style={{
              ...ss.text.btnCaps,
              color: color.grayMid,
            }}
          >
            {toCoin.symbol} {getChainDisplayName(toChain, false, false)}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

// Styles for dropdown
const getStyles = (color: Colorway, ss: SkinStyleSheet) =>
  StyleSheet.create({
    textContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    coinPickerWrap: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    coinDropdown: {
      width: 200,
      backgroundColor: color.white,
      borderRadius: 13,
      flexDirection: "column",
      marginLeft: -46,
    },
    coinButton: {
      borderColor: color.grayLight,
      borderWidth: 1,
      borderRadius: 8,
      height: 40,
      paddingVertical: 8,
      paddingHorizontal: 16,
      ...ss.container.shadow,
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
    },
    coinPickItem: {
      borderBottomWidth: 1,
      borderBottomColor: color.grayLight,
      paddingHorizontal: 20,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    sheetContainer: {
      // add horizontal space
      marginHorizontal: 24,
      ...ss.container.shadow,
    },
    contentContainer: {
      flex: 1,
      alignItems: "center",
    },
    sendPairContainer: {
      width: 24,
      height: 24,
      left: -2, // offset chain image
      position: "relative",
    },
    coinImage: {
      width: 24,
      height: 24,
      position: "absolute",
      top: 0,
      left: 0,
    },
    chainImageContainer: {
      position: "absolute",
      bottom: -4,
      right: -6,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: "white",
      overflow: "hidden",
    },
    chainImage: {
      width: 14,
      height: 14,
    },
  });
