import {
  DAv2Chain,
  ForeignToken,
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  baseUSDC,
  getChainDisplayName,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy,
  getSupportedSendPairs,
  SendPair,
} from "@daimo/common";
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
import { color, ss } from "../../shared/style";

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
  toChain,
  setCoin,
  setChain,
}: {
  toCoin: ForeignToken;
  toChain: DAv2Chain;
  setCoin: (coin: ForeignToken) => void;
  setChain: (chain: DAv2Chain) => void;
}) {
  const account = useAccount();

  if (account == null) return null;

  const onSetPair = (entry: SendPair) => {
    setCoin(entry.coin);
    setChain(entry.chain);
  };

  const homeCoin = baseUSDC; // TODO: add home coin to account
  const chainUri = getChainUri(toChain);
  const supportedSendPairs = getSupportedSendPairs(toChain.chainId);

  return (
    <SelectDropdown
      data={supportedSendPairs}
      defaultValue={homeCoin}
      onSelect={onSetPair}
      renderButton={() => (
        <View
          style={{
            ...styles.coinButton,
            backgroundColor: color.white,
          }}
        >
          <View style={styles.coinPickerWrap}>
            <SendPairImage coinUri={toCoin.logoURI} chainSource={chainUri} />
            <View style={styles.textContainer}>
              <Text
                style={{
                  ...ss.text.btnCaps,
                  color: color.grayDark,
                }}
              >
                {toCoin.symbol}
              </Text>
              <Text
                style={{
                  ...ss.text.btnCaps,
                  color: color.grayMid,
                }}
              >
                {getChainDisplayName(toChain, true, true)}
              </Text>
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
  toChain,
  onClick,
}: {
  toCoin: ForeignToken;
  toChain: DAv2Chain;
  onClick: () => void;
}) {
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
const styles = StyleSheet.create({
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
