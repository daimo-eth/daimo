import { assert } from "@daimo/common";
import { Map } from "immutable";
import { memo, useCallback, useMemo, useReducer } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import Spacer from "./Spacer";
import { TextBody } from "./text";
import { Colorway, SkinStyleSheet } from "../style/skins";
import { useTheme } from "../style/theme";

export function SeedPhraseDisplay({ words }: { words: string[] }) {
  const { color, ss } = useTheme();
  const styles = useMemo(() => getStyles(color, ss), [color, ss]);

  const renderCell = useCallback(
    (index: number) => (
      <SeedPhraseCell
        key={index}
        mode="read"
        text={words[index - 1]}
        num={index}
      />
    ),
    [words]
  );

  const n2 = words.length / 2;
  assert(n2 === Math.floor(n2), "Odd number of words");
  const col1 = Array.from({ length: n2 }, (_, i) => i + 1);
  const col2 = Array.from({ length: n2 }, (_, i) => i + n2 + 1);

  return (
    <View style={styles.box}>
      <View style={styles.boxColumn}>{col1.map(renderCell)}</View>
      <View style={styles.boxColumn}>{col2.map(renderCell)}</View>
    </View>
  );
}

export type SeedPhraseInputState = Map<number, string>;
export type SeedPhraseInputAction = { key: number; value: string };

export function SeedPhraseEntry({
  state,
  dispatch,
}: {
  state: Map<number, string>;
  dispatch: (a: { key: number; value: string }) => void;
}) {
  const { color, ss } = useTheme();
  const styles = useMemo(() => getStyles(color, ss), [color, ss]);

  const handleInputChange = (index: number, text: string) => {
    dispatch({ key: index, value: text });
  };

  const renderCell = useCallback(
    (index: number) => (
      <SeedPhraseCell
        key={index}
        mode="edit"
        value={state.get(index)}
        num={index}
        onChangeText={(text) => handleInputChange(index, text)}
      />
    ),
    [state]
  );

  const indices = [...state.keys()];
  const n = indices.length;
  return (
    <View style={styles.box}>
      <View style={styles.boxColumn}>
        {indices.filter((i) => i <= n / 2).map(renderCell)}
      </View>
      <View style={styles.boxColumn}>
        {indices.filter((i) => i > n / 2).map(renderCell)}
      </View>
    </View>
  );
}

function SeedPhraseCellInner({
  mode,
  value,
  text,
  num,
  onChangeText,
}: {
  mode: "read" | "edit";
  value?: string;
  text?: string;
  num: number;
  onChangeText?: (text: string) => void;
}) {
  const { color, ss } = useTheme();
  const styles = useMemo(() => getStyles(color, ss), [color, ss]);

  return (
    <View style={styles.boxInputWrapper}>
      <View style={{ width: 24 }}>
        <TextBody color={color.gray3}>{num}</TextBody>
      </View>
      <Spacer w={8} />
      {mode === "read" ? (
        <TextBody>{text}</TextBody>
      ) : (
        <TextInput
          style={styles.boxInput}
          value={value}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={onChangeText}
          hitSlop={{ top: 8, bottom: 4, left: 24, right: 4 }}
        />
      )}
    </View>
  );
}

const SeedPhraseCell = memo(SeedPhraseCellInner);

type SeedPhraseInputReducer = (
  state: SeedPhraseInputState,
  action: SeedPhraseInputAction
) => SeedPhraseInputState;

// Pass indices to have user enter a subset of the words.
export function useSeedPhraseInput(indices?: number[]) {
  if (indices == null) {
    indices = Array.from({ length: 12 }, (_, i) => i + 1);
  }
  const initState = Map(indices.map((i) => [i, ""]));

  return useReducer<SeedPhraseInputReducer>(
    (state, next) => state.set(next.key, next.value),
    initState
  );
}

const getStyles = (color: Colorway, ss: SkinStyleSheet) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: color.white,
      paddingHorizontal: 24,
    },
    box: {
      borderWidth: 1,
      borderColor: color.grayLight,
      borderRadius: 8,
      flexDirection: "row",
      gap: 24,
      paddingVertical: 20,
      paddingHorizontal: 24,
      backgroundColor: color.white,
      ...ss.container.shadow,
    },
    boxColumn: {
      flex: 1,
    },
    boxInputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderBottomColor: color.grayLight,
      borderBottomWidth: 2,
      marginBottom: 8,
      paddingVertical: 4,
    },
    boxInput: {
      flex: 1,
      ...ss.text.body,
    },
    copyButton: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      flexDirection: "row",
      borderRadius: 4,
    },
  });
