import Octicons from "@expo/vector-icons/Octicons";
import { useRef, useState } from "react";
import { StyleSheet, TextInput, TouchableHighlight, View } from "react-native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

import Spacer from "../../shared/Spacer";
import { color, ss, touchHighlightUnderlay } from "../../shared/style";
import { TextBtnCaps, TextCenter, TextColor } from "../../shared/text";

export function SendMemoButton({
  memo,
  memoStatus,
  setMemo,
}: {
  memo: string | undefined;
  memoStatus: "ok" | string | undefined;
  setMemo: (memo: string | undefined) => void;
}) {
  const [isFocused, setIsFocused] = useState(false);

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
            placeholder="WHAT'S THIS FOR?"
            placeholderTextColor={
              memo || isFocused ? color.grayMid : color.midnight
            }
            onChangeText={setMemo}
            style={{ ...ss.text.btnCaps, minWidth: 140 }}
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
              {"memo " + memoStatus.toLowerCase()}
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

const styles = StyleSheet.create({
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
