import { daimoUSDC, ForeignCoin, stablecoinCoins } from "@daimo/common";
import { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  TouchableHighlight,
} from "react-native";
import SelectDropdown from "react-native-select-dropdown";

import { useAccount } from "../../../logic/accountManager";
import { DropdownPickButton } from "../../shared/DropdownPickButton";
import { color, ss, touchHighlightUnderlay } from "../../shared/style";
import { DaimoText } from "../../shared/text";

export function SendCoinButton({
  coin,
  setCoin,
  isFixed,
}: {
  coin: ForeignCoin;
  setCoin: (coin: ForeignCoin) => void;
  isFixed: boolean;
}) {
  const account = useAccount();
  const [unchangeableCoinAttempt, setUnchangeableCoinAttempt] =
    useState<boolean>(false);

  if (account == null) return null;

  const onSetCoin = (entry: ForeignCoin) => {
    setCoin(entry);
  };

  // TODO: tell user that they can't change coin when sending to another Daimo account
  const onPressCoinChange = () => {
    if (isFixed) {
      setUnchangeableCoinAttempt(true);
    }
  };

  const homeCoin = daimoUSDC; // change to account.homeCoin in future

  return (
    <View style={{ ...styles.coinButton }}>
      <Pressable onPress={onPressCoinChange}>
        <View style={styles.coinPickerWrap}>
          {!isFixed && (
            <CoinPicker
              homeCoin={homeCoin}
              allCoins={stablecoinCoins}
              onSetCoin={onSetCoin}
            />
          )}
          <Text style={{ ...ss.text.btnCaps }}>{coin.symbol}</Text>
        </View>
      </Pressable>
    </View>
  );
}

export function CoinPellet({
  coin,
  onClick,
}: {
  coin: ForeignCoin;
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

// Coin dropdown
function CoinPicker({
  homeCoin,
  allCoins,
  onSetCoin,
}: {
  homeCoin: ForeignCoin;
  allCoins: ForeignCoin[];
  onSetCoin: (coin: ForeignCoin) => void;
}) {
  const choose = (val: ForeignCoin) => {
    if (val == null) return;
    onSetCoin(val);
  };

  return (
    <View style={styles.coinPickerWrap}>
      <SelectDropdown
        data={allCoins}
        defaultValue={homeCoin}
        onSelect={choose}
        renderButton={() => (
          <View>
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
    </View>
  );
}

function CoinPickerDisabledBanner() {
  return (
    <View>
      <Text style={{ ...ss.text.btnCaps }}>
        Cannot change coin when sending to another Daimo account
      </Text>
    </View>
  );
}

function CoinPickItem({ coin }: { coin: ForeignCoin }) {
  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: color.grayLight,
        paddingHorizontal: 24,
        paddingVertical: 13,
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <DaimoText variant="dropdown">{coin.symbol}</DaimoText>
    </View>
  );
}

// Styles for dropdown
const styles = StyleSheet.create({
  coinPickerWrap: {
    width: "fit-content",
    height: 40,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  coinDropdown: {
    width: "fit-content",
    backgroundColor: color.white,
    borderRadius: 13,
    flexDirection: "column",
  },
  coinButton: {
    backgroundColor: color.white,
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
