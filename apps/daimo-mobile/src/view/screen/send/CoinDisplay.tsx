import {
  ForeignCoin,
  getHomeCoinByAddress,
  supportedSendCoins,
} from "@daimo/common";
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

  if (account == null) return null;

  const onSetCoin = (entry: ForeignCoin) => {
    setCoin(entry);
  };
  const homeCoin = getHomeCoinByAddress(account.homeCoinAddress);

  return (
    <View
      style={{
        ...styles.coinButton,
        backgroundColor: isFixed ? color.grayLight : color.white,
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
        <Text style={{ ...ss.text.btnCaps }}>{coin.symbol}</Text>
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
  homeCoin: ForeignCoin;
  allCoins: ForeignCoin[];
  onSetCoin: (coin: ForeignCoin) => void;
}) {
  const choose = (val: ForeignCoin) => {
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

function CoinPickItem({ coin }: { coin: ForeignCoin }) {
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
