import {
  ForeignCoin,
  getHomeCoinByAddress,
  stablecoinCoins,
} from "@daimo/common";
import { useState } from "react";
import { View, StyleSheet, Text, Pressable } from "react-native";
import SelectDropdown from "react-native-select-dropdown";

import { useAccount } from "../../../logic/accountManager";
import { DropdownPickButton } from "../../shared/DropdownPickButton";
import { color, ss } from "../../shared/style";
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

  // TODO: tell user that they can't change coin when sending to another Daimo account
  const [unchangeableCoinAttempt, setUnchangeableCoinAttempt] =
    useState<boolean>(false);
  const onPressCoinChange = () => {
    if (isFixed) {
      setUnchangeableCoinAttempt(true);
    }
  };

  if (account == null) return null;

  const onSetCoin = (entry: ForeignCoin) => {
    setCoin(entry);
  };
  const homeCoin = getHomeCoinByAddress(account.homeCoinAddress);

  return (
    <View style={{ ...styles.coinButton }}>
      <Pressable onPress={onPressCoinChange}>
        <View style={styles.coinPickerWrap}>
          {!isFixed && (
            <CoinPicker
              homeCoin={homeCoin}
              allCoins={[...stablecoinCoins.values()]}
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
    <View>
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
    </View>
  );
}

function CoinPickerDisabledBanner({ onClose }: { onClose: () => void }) {
  return (
    <Text style={{ ...ss.text.btnCaps }}>
      Cannot change coin when sending to another Daimo account.
    </Text>
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
      }}
    >
      <DaimoText variant="dropdown">{coin.symbol}</DaimoText>
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
