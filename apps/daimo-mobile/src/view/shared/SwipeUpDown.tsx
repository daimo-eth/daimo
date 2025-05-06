import BottomSheet, {
  BottomSheetBackdrop,
  SCREEN_WIDTH,
} from "@gorhom/bottom-sheet";
import { BottomSheetDefaultBackdropProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types";
import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import {
  ReactNode,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ScrollPellet from "./ScrollPellet";
import { ParamListBottomSheet, useNav } from "../../common/nav";
import useTabBarHeight from "../../common/useTabBarHeight";
import {
  HistoryOpBottomSheet,
  SetBottomSheetDetailHeight,
} from "../screen/history/HistoryOpBottomSheet";
import { Colorway } from "../style/skins";
import { useTheme } from "../style/theme";

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
    const { color } = useTheme();
    const ins = useSafeAreaInsets();
    const tabBarHeight = useTabBarHeight();

    const maxHeightOffset = screenDimensions.height - ins.top - ins.bottom;
    const [detailHeight, setDetailHeight] = useState(0);
    const snapPointCount = detailHeight > 0 ? 2 : 3;

    const snapPoints = useMemo(() => {
      if (snapPointCount === 2) {
        return [detailHeight, maxHeightOffset - tabBarHeight];
      } else {
        return [swipeHeight, 440, maxHeightOffset - tabBarHeight];
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
        backgroundStyle={{ backgroundColor: color.white }}
      >
        <SetBottomSheetDetailHeight.Provider value={setDetailHeight}>
          <SwipeContext.Provider
            value={{ isMini, itemMiniStyle, itemMini, itemFull }}
          >
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
                  component={HistoryOpBottomSheet}
                />
              </BottomSheetStackNavigator.Group>
            </BottomSheetStackNavigator.Navigator>
          </SwipeContext.Provider>
        </SetBottomSheetDetailHeight.Provider>
      </BottomSheet>
    );
  }
);

type SwipeContextValue = {
  itemMini: ReactNode;
  itemFull: ReactNode;
  isMini: boolean;
  itemMiniStyle: { opacity: number };
};

const SwipeContext = createContext<SwipeContextValue | null>(null);

function useSwipeContext() {
  const ctx = useContext(SwipeContext);

  if (!ctx) throw new Error("Must be used inside a SwipeContext");

  return ctx;
}

// Fade animation between minified and full lists
function TransactionList() {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);
  const { itemMini, itemFull, isMini, itemMiniStyle } = useSwipeContext();

  return (
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
}

const ANIMATION_CONFIG = {
  stiffness: 160,
  damping: 18,
  mass: 1,
  restDisplacement: 1,
};

const getStyles = (color: Colorway) =>
  StyleSheet.create({
    itemMiniWrapper: {
      position: "absolute",
      zIndex: 100,
      width: "100%",
      backgroundColor: color.white,
    },
  });
