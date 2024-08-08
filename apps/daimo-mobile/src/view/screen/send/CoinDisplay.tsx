import {
  AccountChain,
  ForeignToken,
  arbitrum,
  arbitrumUSDC,
  base,
  baseUSDC,
  optimism,
  optimismUSDC,
  polygon,
  polygonUSDC,
  supportedSendCoins,
} from "@daimo/common";
import { Pressable, StyleSheet, Text, View } from "react-native";
import SelectDropdown from "react-native-select-dropdown";

import { useAccount } from "../../../logic/accountManager";
import { DropdownPickButton } from "../../shared/DropdownPickButton";
import { color, ss } from "../../shared/style";
import { DaimoText } from "../../shared/text";

const supportedChainCoinPairs: [AccountChain, ForeignToken][] = [
  [base, baseUSDC],
  [arbitrum, arbitrumUSDC],
  [optimism, optimismUSDC],
  [polygon, polygonUSDC],
];

export function SendChainAndCoinButton({
  chain,
  setChain,
  coin,
  setCoin,
  isFixed,
}: {
  coin: ForeignToken;
  setCoin: (coin: ForeignToken) => void;
  chain: AccountChain;
  setChain: (chain: AccountChain) => void;
  isFixed: boolean;
}) {
  const account = useAccount();

  if (account == null) return null;

  const onSetCoin = (entry: ForeignToken) => {
    setCoin(entry);
  };
  const onSetChain = (entry: AccountChain) => {
    setChain(entry);
  };

  const homeChain = base;
  const homeCoin = baseUSDC; // TODO: add home coin to account

  return (
    <View style={{ width: 130 }}>
      {isFixed ? (
        <View
          style={{
            ...styles.coinButton,
            backgroundColor: color.white,
          }}
        >
          <View style={styles.coinPickerWrap}>
            <Text
              style={{
                ...ss.text.btnCaps,
                color: isFixed ? color.grayMid : color.midnight,
              }}
            >
              {chain.name} {coin.symbol}
            </Text>
          </View>
        </View>
      ) : (
        <ChainAndCoinPicker
          homeChain={homeChain}
          homeCoin={homeCoin}
          allChainCoinPairs={supportedChainCoinPairs}
          chain={chain}
          coin={coin}
          onSetCoin={onSetCoin}
          onSetChain={onSetChain}
        />
      )}
    </View>
  );
}

function ChainAndCoinPicker({
  homeChain,
  homeCoin,
  allChainCoinPairs,
  chain,
  coin,
  onSetChain,
  onSetCoin,
}: {
  homeChain: AccountChain;
  homeCoin: ForeignToken;
  allChainCoinPairs: [AccountChain, ForeignToken][];
  chain: AccountChain;
  coin: ForeignToken;
  onSetChain: (chain: AccountChain) => void;
  onSetCoin: (coin: ForeignToken) => void;
}) {
  const choose = (val: [AccountChain, ForeignToken]) => {
    if (val == null) return;
    onSetChain(val[0]);
    onSetCoin(val[1]);
  };

  return (
    <SelectDropdown
      data={allChainCoinPairs}
      defaultValue={allChainCoinPairs.find(
        ([chain, coin]) => chain === homeChain && coin === homeCoin
      )}
      onSelect={choose}
      renderButton={() => (
        <View
          style={{
            ...styles.coinButton,
            backgroundColor: color.white,
          }}
        >
          <View style={styles.coinPickerWrap}>
            <View style={{ display: "flex", flexDirection: "row", gap: 10 }}>
              <DropdownPickButton size={16} iconSize={12} />
              <Text
                style={{
                  ...ss.text.btnCaps,
                  color: color.midnight,
                }}
              >
                {chain.name} {coin.symbol}
              </Text>
            </View>
          </View>
        </View>
      )}
      renderItem={([chain, coin]) => (
        <View>
          <ChainAndCoinPickItem chain={chain} coin={coin} />
        </View>
      )}
      dropdownStyle={styles.chainAndCoinDropdown}
    />
  );
}

function ChainAndCoinPickItem({
  chain,
  coin,
}: {
  chain: AccountChain;
  coin: ForeignToken;
}) {
  return (
    <View style={styles.chainAndCoinPickItem}>
      <DaimoText variant="dropdown">
        {chain.name} {coin.symbol}
      </DaimoText>
    </View>
  );
}

export function ChainAndCoinPellet({
  chain,
  coin,
  onClick,
}: {
  chain: AccountChain;
  coin: ForeignToken;
  onClick: () => void;
}) {
  return (
    <View style={{ ...styles.coinButton }}>
      <Pressable onPress={onClick}>
        <View style={styles.coinPickerWrap}>
          <Text style={{ ...ss.text.btnCaps }}>
            {chain.name} {coin.symbol}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

export function SendCoinButton({
  coin,
  setCoin,
  isFixed,
}: {
  coin: ForeignToken;
  setCoin: (coin: ForeignToken) => void;
  isFixed: boolean;
}) {
  const account = useAccount();

  if (account == null) return null;

  const onSetCoin = (entry: ForeignToken) => {
    setCoin(entry);
  };
  const homeCoin = baseUSDC; // TODO: add home coin to account

  return (
    <View
      style={{
        ...styles.coinButton,
        backgroundColor: color.white,
      }}
    >
      <View style={styles.coinPickerWrap}>
        {!isFixed && (
          <CoinPicker
            homeCoin={homeCoin}
            allCoins={[...supportedSendCoins.values()]}
            onSetCoin={onSetCoin}
          />
        )}
        <Text
          style={{
            ...ss.text.btnCaps,
            color: isFixed ? color.grayMid : color.midnight,
          }}
        >
          {coin.symbol}
        </Text>
      </View>
    </View>
  );
}

// Coin dropdown
function CoinPicker({
  homeCoin,
  allCoins,
  onSetCoin,
}: {
  homeCoin: ForeignToken;
  allCoins: ForeignToken[];
  onSetCoin: (coin: ForeignToken) => void;
}) {
  const choose = (val: ForeignToken) => {
    if (val == null) return;
    onSetCoin(val);
  };

  return (
    <SelectDropdown
      data={allCoins}
      defaultValue={homeCoin}
      onSelect={choose}
      renderButton={() => (
        <View style={{ display: "flex" }}>
          <DropdownPickButton size={16} iconSize={12} />
        </View>
      )}
      renderItem={(c) => (
        <View>
          <CoinPickItem coin={c} />
        </View>
      )}
      dropdownStyle={styles.coinDropdown}
    />
  );
}

function CoinPickItem({ coin }: { coin: ForeignToken }) {
  return (
    <View style={styles.coinPickItem}>
      <DaimoText variant="dropdown">{coin.symbol}</DaimoText>
    </View>
  );
}

export function CoinPellet({
  coin,
  onClick,
}: {
  coin: ForeignToken;
  onClick: () => void;
}) {
  return (
    <View style={{ ...styles.coinButton }}>
      <Pressable onPress={onClick}>
        <View style={styles.coinPickerWrap}>
          <Text style={{ ...ss.text.btnCaps }}>{coin.symbol}</Text>
        </View>
      </Pressable>
    </View>
  );
}

// Styles for dropdown
const styles = StyleSheet.create({
  coinPickerWrap: {
    height: 40,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  coinDropdown: {
    width: 105,
    backgroundColor: color.white,
    borderRadius: 13,
    flexDirection: "column",
  },
  chainAndCoinDropdown: {
    width: 130,
    backgroundColor: color.white,
    borderRadius: 13,
    flexDirection: "column",
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
    paddingHorizontal: 24,
    paddingVertical: 13,
    flexDirection: "row",
  },
  chainAndCoinPickItem: {
    borderBottomWidth: 1,
    borderBottomColor: color.grayLight,
    paddingHorizontal: 24,
    paddingVertical: 13,
    flexDirection: "row",
    width: "100%",
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
});
