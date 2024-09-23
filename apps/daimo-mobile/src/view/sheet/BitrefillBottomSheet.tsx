import { DollarStr, usdEntry } from "@daimo/common";
import { polygonUSDC } from "@daimo/contract";
import { useState } from "react";
import { View } from "react-native";
import { Address } from "viem";

import { i18n } from "../../i18n";
import { EAccountContact } from "../../logic/daimoContacts";
import { Account } from "../../storage/account";
import { CoinPellet } from "../screen/send/CoinDisplay";
import { SendTransferButton } from "../screen/send/SendTransferButton";
import { AmountChooser } from "../shared/AmountInput";
import { ContactDisplay } from "../shared/ContactDisplay";
import { IconRow } from "../shared/IconRow";
import Spacer from "../shared/Spacer";
import { useWithAccount } from "../shared/withAccount";
import { useTheme } from "../style/theme";

export function BitrefillBottomSheet({
  address,
  amount,
}: {
  address: Address;
  amount: DollarStr;
}) {
  const Inner = useWithAccount(BitrefillBottomSheetInner);
  return <Inner address={address} amount={amount} />;
}

function BitrefillBottomSheetInner({
  account,
  address,
  amount,
}: {
  account: Account;
  address: Address;
  amount: `${number}`;
}) {
  const { color } = useTheme();
  const recipient: EAccountContact = { type: "eAcc", addr: address };
  // Show "bitrefill" as the name, but only on the send screen
  const recipientWithName = { ...recipient, name: "Bitrefill" };

  const money = usdEntry(amount);
  const toCoin = polygonUSDC;

  const [success, setSuccess] = useState(false);

  return (
    <View>
      <Spacer h={24} />
      <ContactDisplay
        contact={recipientWithName}
        isRequest={false}
        onPress={() => {}}
      />
      <Spacer h={24} />
      <AmountChooser
        moneyEntry={money}
        onSetEntry={() => {}}
        showCurrencyPicker={false}
        disabled
        showAmountAvailable={false}
        autoFocus={false}
        onFocus={() => {}}
      />
      <Spacer h={16} />
      <CoinPellet toCoin={toCoin} onClick={() => {}} />
      <Spacer h={24} />
      <SendTransferButton
        account={account}
        memo="Bitrefill"
        recipient={recipient}
        money={money}
        toCoin={toCoin}
        onSuccess={() => setSuccess(true)}
      />
      {success && (
        <IconRow
          icon="check-circle"
          color={color.successDark}
          title={i18n.deposit.bitrefill.success()}
        />
      )}
      <Spacer h={48} />
    </View>
  );
}
