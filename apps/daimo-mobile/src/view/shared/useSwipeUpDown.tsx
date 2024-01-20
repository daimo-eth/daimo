import { SCREEN_WIDTH } from "@gorhom/bottom-sheet";
import { useIsFocused } from "@react-navigation/native";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { Dimensions, Platform, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { SwipeUpDown, SwipeUpDownRef } from "./SwipeUpDown";
import { useNav } from "./nav";
import useTabBarHeight from "../../common/useTabBarHeight";

const screenDimensions = Dimensions.get("screen");

export function useSwipeUpDown({
  itemMini,
  itemFull,
  translationY,
  disabled,
  bottomSheetRef,
}: {
  itemMini: ReactNode;
  itemFull: ReactNode;
  translationY: Animated.SharedValue<number>;
  disabled?: boolean;
  bottomSheetRef: React.RefObject<SwipeUpDownRef>;
}) {
  const [isBottomSheetOpen, setIsOpen] = useState(false);

  // Dimensions
  const tabBarHeight = useTabBarHeight();
  const screenHeight =
    screenDimensions.height -
    tabBarHeight -
    (Platform.OS === "android" ? 16 : 0);

  // Hide bottom sheet when tapping a bottom tab.
  const nav = useNav();
  const isFocused = useIsFocused();
  useEffect(() => {
    if (nav.getParent()) {
      // @ts-ignore
      const unsub = nav.getParent().addListener("tabPress", (e: Event) => {
        if (isFocused && bottomSheetRef.current) {
          e.preventDefault();
          bottomSheetRef.current.collapse();
        }
      });
      return unsub;
    }
  }, [nav, isFocused]);

  const bottomSheetScrollStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: -translationY.value,
        },
      ],
    };
  });

  const bottomSheet = (
    <Animated.View
      style={[
        { height: screenHeight },
        styles.bottomSheetContainer,
        bottomSheetScrollStyle,
      ]}
      pointerEvents="box-none"
    >
      <SwipeUpDown
        ref={bottomSheetRef}
        itemMini={itemMini}
        itemFull={itemFull}
        swipeHeight={(screenDimensions.height / 3.5) | 0}
        onShowFull={useCallback(() => setIsOpen(true), [])}
        onShowMini={useCallback(() => setIsOpen(false), [])}
        disabled={disabled}
      />
    </Animated.View>
  );

  return {
    bottomSheet,
    isBottomSheetOpen,
  };
}

const styles = StyleSheet.create({
  bottomSheetContainer: {
    position: "absolute",
    width: SCREEN_WIDTH,
  },
});
