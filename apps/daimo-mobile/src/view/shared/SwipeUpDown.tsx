import BottomSheet, {
  BottomSheetBackdrop,
  SCREEN_WIDTH,
} from "@gorhom/bottom-sheet";
import { BottomSheetDefaultBackdropProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types";
import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { ReactNode, forwardRef, useCallback, useMemo, useState } from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ScrollPellet from "./ScrollPellet";
import { ParamListBottomSheet, useNav } from "./nav";
import { color } from "./style";
import useTabBarHeight from "../../common/useTabBarHeight";
import {
  HistoryOpScreen,
  ChangeBottomSheetSnapsContext,
} from "../screen/HistoryOpScreen";

const BottomSheetStackNavigator =
  createNativeStackNavigator<ParamListBottomSheet>();

const noHeaders: NativeStackNavigationOptions = {
  headerShown: false,
  animation: "fade",
};

interface SwipeUpDownProps {
  itemMini: ReactNode;
  itemFull: ReactNode;
  swipeHeight: number;
  onShowMini?: () => void;
  onShowFull?: () => void;
  disabled?: boolean;
}

const screenDimensions = Dimensions.get("window");

export type SwipeUpDownRef = {
  collapse: () => void;
  expand: () => void;
};

export const SwipeUpDown = forwardRef<SwipeUpDownRef, SwipeUpDownProps>(
  (
    { itemMini, itemFull, swipeHeight, onShowMini, onShowFull, disabled },
    ref
  ) => {
    const ins = useSafeAreaInsets();
    const tabBarHeight = useTabBarHeight();

    const maxHeightOffset = screenDimensions.height - ins.top - ins.bottom;
    const [snapPointCount, setSnapPointCount] = useState<2 | 3>(3);

    const snapPoints = useMemo(() => {
      if (snapPointCount === 2) {
        return [450, maxHeightOffset - tabBarHeight];
      } else {
        return [swipeHeight, 450, maxHeightOffset - tabBarHeight];
      }
    }, [maxHeightOffset, snapPointCount]);

    const [isMini, setIsMini] = useState(true);

    const nav = useNav();

    const showFull = () => {
      setIsMini(false);
      onShowFull?.();
    };

    const showMini = () => {
      // react-native-nav typescript types broken
      (nav as any).navigate("BottomSheetList");

      setIsMini(true);
      onShowMini?.();
    };

    const renderBackdrop = useCallback(
      (props: BottomSheetDefaultBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={snapPointCount - 3}
          appearsOnIndex={snapPointCount - 2}
          pressBehavior="none" // Disable fully closing to swipeIndex -1
        />
      ),
      [snapPointCount]
    );

    const handleSheetChanges = (snapIndex: number) => {
      console.log(`[SWIPE] snapIndex ${snapIndex}`);
      Haptics.selectionAsync();
      if (snapPointCount === 3 && snapIndex < 1) {
        showMini();
      } else {
        showFull();
      }
    };

    const animatedIndex = useSharedValue(0);
    const itemMiniStyle = useAnimatedStyle(() => {
      return {
        opacity: 1 - animatedIndex.value,
      };
    });

    const TransactionList = () => (
      <>
        <Animated.View
          style={[styles.itemMiniWrapper, itemMiniStyle]}
          pointerEvents={isMini ? "auto" : "none"}
        >
          {itemMini}
        </Animated.View>
        {itemFull}
      </>
    );

    return (
      <BottomSheet
        index={0}
        snapPoints={snapPoints}
        handleComponent={ScrollPellet}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        animatedIndex={animatedIndex}
        animateOnMount={false}
        enablePanDownToClose={false}
        enableHandlePanningGesture={!disabled}
        enableContentPanningGesture={!disabled}
        activeOffsetX={[-SCREEN_WIDTH, SCREEN_WIDTH]}
        activeOffsetY={[-10, 10]}
        animationConfigs={ANIMATION_CONFIG}
      >
        <ChangeBottomSheetSnapsContext.Provider value={setSnapPointCount}>
          <BottomSheetStackNavigator.Navigator
            initialRouteName="BottomSheetList"
            screenOptions={noHeaders}
          >
            <BottomSheetStackNavigator.Group>
              <BottomSheetStackNavigator.Screen
                name="BottomSheetList"
                component={TransactionList}
              />
              <BottomSheetStackNavigator.Screen
                name="BottomSheetHistoryOp"
                component={HistoryOpScreen}
              />
            </BottomSheetStackNavigator.Group>
          </BottomSheetStackNavigator.Navigator>
        </ChangeBottomSheetSnapsContext.Provider>
      </BottomSheet>
    );
  }
);

const ANIMATION_CONFIG = {
  stiffness: 160,
  damping: 18,
  mass: 1,
  restDisplacement: 1,
};

const styles = StyleSheet.create({
  itemMiniWrapper: {
    position: "absolute",
    zIndex: 100,
    width: "100%",
    backgroundColor: color.white,
  },
});
