import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { BottomSheetDefaultBackdropProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ScrollPellet from "../view/shared/ScrollPellet";

interface SwipeUpDownProps {
  itemMini: ReactNode;
  itemFull: ReactNode;
  swipeHeight: number;
  onShowMini?: () => void;
  onShowFull?: () => void;
}

const screenDimensions = Dimensions.get("screen");

export function SwipeUpDown({
  itemMini,
  itemFull,
  swipeHeight,
}: SwipeUpDownProps) {
  const ins = useSafeAreaInsets();

  const maxHeight = screenDimensions.height - ins.top - ins.bottom;
  const posYMini = maxHeight - swipeHeight;
  const posYFull = ins.top;

  const [isMini, setIsMini] = useState(true);

  const animatedIndex = useSharedValue(0);

  const showFull = () => {
    console.log(`[SWIPE] showFull ${posYFull}`);
    setIsMini(false);
  };

  const showMini = () => {
    console.log(`[SWIPE] showFull ${posYMini}`);
    setIsMini(true);
  };

  const snapPoints = useMemo(() => ["35%", "96%"], []);
  const renderBackdrop = useCallback(
    (props: BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={0}
        appearsOnIndex={1}
      />
    ),
    []
  );

  const handleSheetChanges = (snapIndex: number) => {
    if (snapIndex === 0) {
      showMini();
    } else {
      showFull();
    }
  };

  const itemMiniStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - animatedIndex.value * 3,
    };
  });

  return (
    <BottomSheet
      index={0}
      snapPoints={snapPoints}
      handleComponent={ScrollPellet}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      animatedIndex={animatedIndex}
    >
      <BottomSheetScrollView>
        <Animated.View
          style={[styles.itemMiniWrapper, itemMiniStyle]}
          pointerEvents={isMini ? "auto" : "none"}
        >
          {itemMini}
        </Animated.View>
        <View>{itemFull}</View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  itemMiniWrapper: {
    position: "absolute",
    zIndex: 100,
    width: "100%",
  },
});
