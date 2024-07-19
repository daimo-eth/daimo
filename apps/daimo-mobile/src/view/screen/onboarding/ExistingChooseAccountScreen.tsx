import { EAccount } from "@daimo/common";
import React, { useCallback, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";

import { OnboardingHeader } from "./OnboardingHeader";
import { useExitBack, useOnboardingNav } from "../../../common/nav";
import { TranslationFunctions } from "../../../i18n/i18n-types";
import { getAccountManager } from "../../../logic/accountManager";
import { useI18n } from "../../../logic/i18n";
import { getRpcHook } from "../../../logic/trpc";
import { useKeyboardHeight } from "../../../vendor/useKeyboardHeight";
import { InputBig } from "../../shared/InputBig";
import { SearchResultRow } from "../../shared/SearchResults";
import Spacer from "../../shared/Spacer";
import { ErrorRowCentered } from "../../shared/error";
import { color, ss } from "../../shared/style";
import { TextBodyMedium, TextCenter, TextLight } from "../../shared/text";

export function ExistingChooseAccountScreen() {
  const nav = useOnboardingNav();
  const i18n = useI18n();
  const setEAcc = useCallback(
    (targetEAcc: EAccount) => nav.navigate("ExistingUseBackup", { targetEAcc }),
    [nav]
  );

  return (
    <View>
      <OnboardingHeader
        title={i18n.existingChooseAccount.screenHeader()}
        onPrev={useExitBack()}
      />
      <Spacer h={16} />
      <SelectAccount setEAcc={setEAcc} _i18n={i18n} />
    </View>
  );
}

function SelectAccount({
  setEAcc,
  _i18n,
}: {
  setEAcc: (eAcc: EAccount) => void;
  _i18n: TranslationFunctions;
}) {
  const [prefix, setPrefix] = useState("");
  const i18n = _i18n.existingChooseAccount;

  return (
    <View>
      <View style={ss.container.padH24}>
        <TextBodyMedium color={color.grayMid}>
          {i18n.selectAccount.description()}
        </TextBodyMedium>
        <Spacer h={16} />
        <InputBig
          autoFocus
          icon="search"
          placeholder={i18n.selectAccount.placeholder()}
          value={prefix}
          onChange={setPrefix}
        />
      </View>
      <Spacer h={16} />
      <AccountSearchResults prefix={prefix} setEAcc={setEAcc} _i18n={_i18n} />
    </View>
  );
}

function AccountSearchResults({
  prefix,
  setEAcc,
  _i18n,
}: {
  prefix: string;
  setEAcc: (eAcc: EAccount) => void;
  _i18n: TranslationFunctions;
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
          _i18n={_i18n}
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
  const i18n = useI18n().existingChooseAccount;
  return (
    <View>
      <Spacer h={16} />
      <TextCenter>
        <TextLight>{i18n.searchResults.empty()}</TextLight>
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
