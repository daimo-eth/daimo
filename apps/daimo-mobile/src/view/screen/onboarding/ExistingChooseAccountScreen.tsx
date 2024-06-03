import { EAccount } from "@daimo/common";
import React, { useCallback, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";

import { OnboardingHeader } from "./OnboardingHeader";
import { useExitBack, useOnboardingNav } from "../../../common/nav";
import { getAccountManager } from "../../../logic/accountManager";
import { env } from "../../../logic/env";
import { useKeyboardHeight } from "../../../vendor/useKeyboardHeight";
import { InputBig } from "../../shared/InputBig";
import { SearchResultRow } from "../../shared/SearchResults";
import Spacer from "../../shared/Spacer";
import { ErrorRowCentered } from "../../shared/error";
import { color, ss } from "../../shared/style";
import { TextBodyMedium, TextCenter, TextLight } from "../../shared/text";

export function ExistingChooseAccountScreen() {
  const nav = useOnboardingNav();
  const setEAcc = useCallback(
    (targetEAcc: EAccount) => nav.navigate("ExistingUseBackup", { targetEAcc }),
    [nav],
  );

  return (
    <View>
      <OnboardingHeader title="Load account" onPrev={useExitBack()} />
      <Spacer h={16} />
      <SelectAccount setEAcc={setEAcc} />
    </View>
  );
}

function SelectAccount({ setEAcc }: { setEAcc: (eAcc: EAccount) => void }) {
  const [prefix, setPrefix] = useState("");

  return (
    <View>
      <View style={ss.container.padH24}>
        <TextBodyMedium color={color.grayMid}>
          Choose which account you're logging in to.
        </TextBodyMedium>
        <Spacer h={16} />
        <InputBig
          autoFocus
          icon="search"
          placeholder="Enter username..."
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
  const { rpcHook } = env(getAccountManager().getDaimoChain());
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
        <TextLight>No results</TextLight>
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
