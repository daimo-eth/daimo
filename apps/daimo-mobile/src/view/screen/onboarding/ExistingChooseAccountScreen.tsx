import { EAccount } from "@daimo/common";
import React, { useCallback, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";

import { OnboardingHeader } from "./OnboardingHeader";
import { useExitBack, useOnboardingNav } from "../../../common/nav";
import { i18n } from "../../../i18n";
import { getAccountManager } from "../../../logic/accountManager";
import { getRpcHook } from "../../../logic/trpc";
import { useKeyboardHeight } from "../../../vendor/useKeyboardHeight";
import { InputBig } from "../../shared/InputBig";
import { SearchResultRow } from "../../shared/SearchResults";
import Spacer from "../../shared/Spacer";
import { ErrorRowCentered } from "../../shared/error";
import { TextBodyMedium, TextCenter, TextLight } from "../../shared/text";
import { useTheme } from "../../style/theme";

const i18 = i18n.existingChooseAccount;

export function ExistingChooseAccountScreen() {
  const nav = useOnboardingNav();

  const setEAcc = useCallback(
    (targetEAcc: EAccount) => nav.navigate("ExistingUseBackup", { targetEAcc }),
    [nav]
  );

  return (
    <View>
      <OnboardingHeader title={i18.screenHeader()} onPrev={useExitBack()} />
      <Spacer h={16} />
      <SelectAccount setEAcc={setEAcc} />
    </View>
  );
}

function SelectAccount({ setEAcc }: { setEAcc: (eAcc: EAccount) => void }) {
  const { color, ss } = useTheme();
  const [prefix, setPrefix] = useState("");

  return (
    <View>
      <View style={ss.container.padH24}>
        <TextBodyMedium color={color.grayMid}>
          {i18.selectAccount.description()}
        </TextBodyMedium>
        <Spacer h={16} />
        <InputBig
          autoFocus
          icon="search"
          placeholder={i18.selectAccount.placeholder()}
          value={prefix}
          onChange={setPrefix}
        />
      </View>
      <Spacer h={16} />
      <AccountSearchResults prefix={prefix} setEAcc={setEAcc} />
    </View>
  );
}

function AccountSearchResults({
  prefix,
  setEAcc,
}: {
  prefix: string;
  setEAcc: (eAcc: EAccount) => void;
}) {
  const kbH = useKeyboardHeight();

  const enabled = prefix.length >= 1;
  const rpcHook = getRpcHook(getAccountManager().getDaimoChain());
  const res = rpcHook.search.useQuery({ prefix }, { enabled });

  const daimoAccounts = (res.data || []).filter((r) => r.name != null);

  return (
    <ScrollView
      contentContainerStyle={styles.resultsScroll}
      keyboardShouldPersistTaps="handled"
      style={{ flexGrow: 1 }}
    >
      {res.error && <ErrorRowCentered error={res.error} />}

      {daimoAccounts.map((acc) => (
        <SearchResultRow
          key={acc.name}
          contact={{ type: "eAcc", ...acc }}
          onPress={() => setEAcc(acc)}
        />
      ))}
      {res.status === "success" && res.data.length === 0 && prefix !== "" && (
        <NoSearchResults />
      )}
      <Spacer h={32} />
      {Platform.OS === "ios" && <Spacer h={kbH} />}
    </ScrollView>
  );
}

function NoSearchResults() {
  return (
    <View>
      <Spacer h={16} />
      <TextCenter>
        <TextLight>{i18.searchResults.empty()}</TextLight>
      </TextCenter>
    </View>
  );
}

const styles = StyleSheet.create({
  resultsScroll: {
    flexDirection: "column",
    alignSelf: "stretch",
    paddingHorizontal: 24,
  },
});
