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
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
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
import { useNav } from "./nav";
import { color } from "./style";
import useTabBarHeight from "../../common/useTabBarHeight";
import {
  HistoryOpScreen,
  ToggleBottomSheetContext,
} from "../screen/HistoryOpScreen";

const Stack = createNativeStackNavigator();

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
    const bottomRef = useRef<BottomSheet>(null);

    const [posYMini, setPosYMini] = useState(swipeHeight);
    const [posYFull, setPosYFull] = useState(
      screenDimensions.height - ins.top - ins.bottom - tabBarHeight
    );
    const [snapPoints, setSnapPoints] = useState([
      posYMini,
      posYFull - 1,
      posYFull,
    ]);

    useEffect(() => {
      const maxHeightOffset = screenDimensions.height - ins.top - ins.bottom;
      setPosYMini(swipeHeight);
      setPosYFull(maxHeightOffset - tabBarHeight);
    });

    const [isMini, setIsMini] = useState(true);

    // When user selects a transaction, open the bottom sheet part way.
    const animatedIndex = useSharedValue(0);
    const sheetExpand = () => {
      if (animatedIndex.value === 1) {
        bottomRef.current?.snapToIndex(2);
      }
      setSnapPoints([posYMini, 450, posYFull]);
      if (animatedIndex.value === 0) {
        bottomRef.current?.snapToIndex(1);
      }
    };
    const sheetCollapse = () => {
      setSnapPoints([posYMini, posYFull, posYFull]);
      if (animatedIndex.value === 1) {
        bottomRef.current?.snapToIndex(0);
      }
    };

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

    const nav = useNav();

    const showMini = () => {
      console.log(`[SWIPE] showMini ${posYMini}`);
      setIsMini(true);
      onShowMini?.();

      // react-native-nav typescript types broken
      (nav as any).navigate("BottomSheetList");
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
        opacity: 1 - animatedIndex.value * 3,
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
        ref={bottomRef}
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
        <ToggleBottomSheetContext.Provider value={toggleBottomSheet}>
          <Stack.Navigator
            initialRouteName="BottomSheetList"
            screenOptions={noHeaders}
          >
            <Stack.Group>
              <Stack.Screen
                name="BottomSheetList"
                component={TransactionList}
              />
              <Stack.Screen
                name="BottomSheetHistoryOp"
                component={HistoryOpScreen as any}
              />
            </Stack.Group>
          </Stack.Navigator>
        </ToggleBottomSheetContext.Provider>
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
