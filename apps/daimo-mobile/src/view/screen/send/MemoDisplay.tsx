import Octicons from "@expo/vector-icons/Octicons";
import { useMemo, useRef, useState } from "react";
import { StyleSheet, TextInput, TouchableHighlight, View } from "react-native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

import { i18n } from "../../../i18n";
import Spacer from "../../shared/Spacer";
import { TextBtnCaps, TextCenter, TextColor } from "../../shared/text";
import { Colorway, SkinStyleSheet } from "../../style/skins";
import { useTheme } from "../../style/theme";

const i18 = i18n.memoDisplay;

export function SendMemoButton({
  memo,
  memoStatus,
  setMemo,
  autoFocus,
}: {
  memo: string | undefined;
  memoStatus: "ok" | string | undefined;
  setMemo: (memo: string | undefined) => void;
  autoFocus?: boolean;
}) {
  const { color, ss, touchHighlightUnderlay } = useTheme();
  const styles = useMemo(() => getStyles(color, ss), [color, ss]);
  const [isFocused, setIsFocused] = useState(autoFocus || false);

  const ref = useRef<TextInput>(null);

  const cancelMemo = () => {
    setMemo(undefined);
    setIsFocused(false);

    ref.current?.blur();
  };

  const onFocus = () => {
    setIsFocused(true);
  };

  const onBlur = () => {
    setIsFocused(false);
  };

  return (
    <View>
      <TouchableHighlight
        style={{ ...styles.memoButton }}
        onPress={() => ref.current?.focus()}
        {...touchHighlightUnderlay.subtle}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {!isFocused && !memo && (
            <TextCenter>
              <Octicons name="plus-circle" size={14} color={color.primary} />
              <Spacer w={8} />
            </TextCenter>
          )}
          <TextInput
            ref={ref}
            value={memo}
            placeholder={i18.placeholder()}
            placeholderTextColor={
              memo || isFocused ? color.grayMid : color.midnight
            }
            onChangeText={setMemo}
            style={{ ...ss.text.btnCaps, minWidth: 84 }}
            numberOfLines={1}
            onFocus={onFocus}
            onBlur={onBlur}
          />
          {(memo || isFocused) && (
            <>
              <Spacer w={8} />
              <TouchableWithoutFeedback
                style={{
                  justifyContent: "flex-end",
                }}
                onPress={cancelMemo}
                hitSlop={8}
                {...touchHighlightUnderlay.subtle}
              >
                <Octicons name="x" size={16} color={color.primary} />
              </TouchableWithoutFeedback>
            </>
          )}
        </View>
      </TouchableHighlight>
      {memoStatus && memoStatus !== "ok" && (
        <>
          <Spacer h={8} />
          <TextCenter>
            <TextColor color={color.danger}>
              {i18.status(memoStatus.toLowerCase())}
            </TextColor>
          </TextCenter>
        </>
      )}
    </View>
  );
}

export function MemoPellet({
  memo,
  onClick,
}: {
  memo: string | undefined;
  onClick: () => void;
}) {
  const { color, ss, touchHighlightUnderlay } = useTheme();
  const styles = useMemo(() => getStyles(color, ss), [color, ss]);

  return (
    <View>
      <TouchableHighlight
        style={{ ...styles.memoButton }}
        onPress={onClick}
        {...touchHighlightUnderlay.subtle}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextBtnCaps>{memo}</TextBtnCaps>
        </View>
      </TouchableHighlight>
    </View>
  );
}

const getStyles = (color: Colorway, ss: SkinStyleSheet) =>
  StyleSheet.create({
    memoButton: {
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
