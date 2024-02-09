import { DisplayOpEvent } from "@daimo/common";
import BottomSheet, {
  BottomSheetBackdrop,
  SCREEN_WIDTH,
} from "@gorhom/bottom-sheet";
import { BottomSheetDefaultBackdropProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types";
import {
  ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Dimensions, StyleSheet, ViewProps } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ScrollPellet from "./ScrollPellet";
import { color } from "./style";
import useTabBarHeight from "../../common/useTabBarHeight";
import { Account } from "../../model/account";
import {
  HistoryOpScreen,
  ToggleBottomSheetContext,
} from "../screen/HistoryOpScreen";

interface SwipeUpDownProps {
  itemMini: ReactNode;
  itemFull: ReactNode;
  swipeHeight: number;
  onShowMini?: () => void;
  onShowFull?: () => void;
  disabled?: boolean;
  account: Account;
  selectedHistoryOp?: DisplayOpEvent;
}

const screenDimensions = Dimensions.get("window");

export type SwipeUpDownRef = {
  collapse: () => void;
  expand: () => void;
};

export const SwipeUpDown = forwardRef<SwipeUpDownRef, SwipeUpDownProps>(
  (
    {
      itemMini,
      itemFull,
      swipeHeight,
      onShowMini,
      onShowFull,
      disabled,
      account,
      selectedHistoryOp,
    },
    ref
  ) => {
    const ins = useSafeAreaInsets();
    const tabBarHeight = useTabBarHeight();
    const bottomRef = useRef<BottomSheet>(null);

    const [posYMini, setPosYMini] = useState(swipeHeight);
    const [posYFull, setPosYFull] = useState(
      screenDimensions.height - ins.top - ins.bottom - tabBarHeight
    );
    const snapPoints = useSharedValue([posYMini, posYFull - 1, posYFull]);
    const nextSnapPoint = useSharedValue(-1);

    useEffect(() => {
      const maxHeightOffset = screenDimensions.height - ins.top - ins.bottom;
      setPosYMini(swipeHeight);
      setPosYFull(maxHeightOffset - tabBarHeight);
    });

    const [isMini, setIsMini] = useState(true);
    const historyOpOpacity = useSharedValue(0);

    // When user selects a transaction, open the bottom sheet part way.
    const animatedIndex = useSharedValue(0);
    const animatedPosition = useSharedValue(0);
    const sheetExpand = () => {
      historyOpOpacity.value = animatedIndex.value === 0 ? 1 : withTiming(1);
      if (animatedIndex.value === 1) {
        nextSnapPoint.value = 2;
      }
      snapPoints.value = [posYMini, 450, posYFull];
      if (animatedIndex.value === 0) {
        nextSnapPoint.value = 1;
      }
    };
    const sheetCollapse = () => {
      if (animatedIndex.value === 1) {
        snapToIndex(0);
      } else {
        historyOpOpacity.value = withTiming(0);
      }
      snapPoints.value = [posYMini, posYFull, posYFull];
    };

    const snapToIndex = (index: number) => {
      bottomRef.current?.snapToIndex(index);
    };

    useAnimatedReaction(
      () => {
        return {
          snapIndex: nextSnapPoint.value,
          shouldSnap: nextSnapPoint.value !== -1,
        };
      },
      ({ snapIndex, shouldSnap }) => {
        if (shouldSnap) {
          runOnJS(snapToIndex)(snapIndex);
          nextSnapPoint.value = -1;
        }
      }
    );

    // When user opens a transfer inside the bottom sheet, sheet expands.
    const toggleBottomSheet = (expand: boolean) => {
      console.log(`[SWIPE] toggleBottomSheet ${expand}`);
      if (expand) {
        sheetExpand();
      } else {
        sheetCollapse();
      }
    };

    useImperativeHandle(ref, () => ({
      collapse() {
        bottomRef.current?.collapse();
      },
      expand() {
        bottomRef.current?.expand();
      },
    }));

    const showFull = () => {
      console.log(`[SWIPE] showFull ${posYFull}`);
      setIsMini(false);
      onShowFull?.();
    };

    const showMini = () => {
      console.log(`[SWIPE] showMini ${posYMini}`);
      snapPoints.value = [posYMini, posYFull, posYFull];
      historyOpOpacity.value = 0;
      setIsMini(true);
      onShowMini?.();
    };

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
        opacity: 1 - animatedIndex.value * 2,
        transform: [{ translateY: Math.max(0, animatedIndex.value * 600) }],
      };
    });

    const itemFullStyle = useAnimatedStyle(() => {
      return {
        opacity: Math.min(1, animatedIndex.value),
      };
    });

    const historyOpContainer = useAnimatedStyle(() => {
      return {
        position: "absolute",
        height: 1000,
        width: "100%",
        zIndex: 10,
        opacity: historyOpOpacity.value,
      };
    });

    const animatedProps: ViewProps = useAnimatedProps(() => {
      return {
        pointerEvents: historyOpOpacity.value ? "auto" : "none",
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
        animatedPosition={animatedPosition}
        animateOnMount={false}
        enablePanDownToClose={false}
        enableHandlePanningGesture={!disabled}
        enableContentPanningGesture={!disabled}
        activeOffsetX={[-SCREEN_WIDTH, SCREEN_WIDTH]}
        activeOffsetY={[-10, 10]}
        animationConfigs={ANIMATION_CONFIG}
      >
        <ToggleBottomSheetContext.Provider value={toggleBottomSheet}>
          <Animated.View
            style={historyOpContainer}
            animatedProps={animatedProps}
          >
            {selectedHistoryOp && (
              <HistoryOpScreen op={selectedHistoryOp} account={account} />
            )}
          </Animated.View>
          <Animated.View
            style={[styles.itemMiniWrapper, itemMiniStyle]}
            pointerEvents={isMini ? "auto" : "none"}
          >
            {itemMini}
          </Animated.View>
          <Animated.View style={[{ flex: 1 }, itemFullStyle]}>
            {itemFull}
          </Animated.View>
        </ToggleBottomSheetContext.Provider>
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

const ANIMATION_CONFIG = {
  stiffness: 160,
  damping: 18,
  mass: 1,
  restDisplacement: 1,
};
