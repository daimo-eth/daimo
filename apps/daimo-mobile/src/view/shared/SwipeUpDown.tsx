import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { BottomSheetDefaultBackdropProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types";
import {
  ReactNode,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ScrollPellet from "./ScrollPellet";
import { color } from "./style";
import useTabBarHeight from "../../vendor/useTabBarHeight";

interface SwipeUpDownProps {
  itemMini: ReactNode;
  itemFull: ReactNode;
  swipeHeight: number;
  onShowMini?: () => void;
  onShowFull?: () => void;
}

const screenDimensions = Dimensions.get("window");

export type SwipeUpDownRef = {
  collapse: () => void;
};

export const SwipeUpDown = forwardRef<SwipeUpDownRef, SwipeUpDownProps>(
  ({ itemMini, itemFull, swipeHeight, onShowMini, onShowFull }, ref) => {
    const ins = useSafeAreaInsets();
    const tabBarHeight = useTabBarHeight();
    const bottomRef = useRef<BottomSheet>(null);

    const maxHeight = screenDimensions.height - ins.top - ins.bottom;
    const posYMini = swipeHeight;
    const posYFull = maxHeight - tabBarHeight;

    const [isMini, setIsMini] = useState(true);

    const animatedIndex = useSharedValue(0);

    useImperativeHandle(ref, () => ({
      collapse() {
        bottomRef.current?.collapse();
      },
    }));

    const showFull = () => {
      console.log(`[SWIPE] showFull ${posYFull}`);
      setIsMini(false);
      onShowFull?.();
    };

    const showMini = () => {
      console.log(`[SWIPE] showMini ${posYMini}`);
      setIsMini(true);
      onShowMini?.();
    };

    const snapPoints = useMemo(
      () => [posYMini, posYFull],
      [posYMini, posYFull]
    );

    const renderBackdrop = useCallback(
      (props: BottomSheetDefaultBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={0}
          appearsOnIndex={1}
          pressBehavior="none" // Disable fully closing to swipeIndex -1
        />
      ),
      []
    );

    const handleSheetChanges = (snapIndex: number) => {
      console.log(`[SWIPE] snapIndex ${snapIndex}`);
      if (snapIndex < 1) {
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
        ref={bottomRef}
        index={0}
        snapPoints={snapPoints}
        handleComponent={ScrollPellet}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        animatedIndex={animatedIndex}
        animateOnMount={false}
        enablePanDownToClose={false}
      >
        <Animated.View
          style={[styles.itemMiniWrapper, itemMiniStyle]}
          pointerEvents={isMini ? "auto" : "none"}
        >
          {itemMini}
        </Animated.View>
        {itemFull}
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  itemMiniWrapper: {
    position: "absolute",
    zIndex: 100,
    width: "100%",
    backgroundColor: color.white,
  },
});
