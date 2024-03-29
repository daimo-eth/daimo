import Octicons from "@expo/vector-icons/Octicons";
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
  useRef,
  useState,
} from "react";
import { Dimensions, Linking, StyleSheet, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ButtonMed } from "./Button";
import ScrollPellet from "./ScrollPellet";
import Spacer from "./Spacer";
import { color, ss } from "./style";
import { TextCenter, TextH3, TextLight, TextLink } from "./text";
import {
  ACTIVE_BOTTOM_SHEET_SCREEN,
  ParamListBottomSheet,
  useNav,
} from "../../common/nav";
import useTabBarHeight from "../../common/useTabBarHeight";
import {
  HistoryOpScreen,
  SetBottomSheetSnapPointCount,
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
    const bsref = useRef<BottomSheet>(null);

    const maxHeightOffset = screenDimensions.height - ins.top - ins.bottom;
    const [activeScreen, setActiveScreen] =
      useState<ACTIVE_BOTTOM_SHEET_SCREEN>(ACTIVE_BOTTOM_SHEET_SCREEN.LIST);

    const snapPoints = useMemo(() => {
      if (activeScreen === ACTIVE_BOTTOM_SHEET_SCREEN.HELP) {
        return [400, maxHeightOffset - tabBarHeight];
      } else if (activeScreen === ACTIVE_BOTTOM_SHEET_SCREEN.HISTORY) {
        return [500, maxHeightOffset - tabBarHeight];
      } else {
        return [swipeHeight, maxHeightOffset - tabBarHeight];
      }
    }, [maxHeightOffset, activeScreen]);

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

    const animatedPosition = useSharedValue(0);
    const myWackyIndex = useDerivedValue(() => {
      const diff = 500 - swipeHeight;
      const offset =
        screenDimensions.height -
        (tabBarHeight + swipeHeight) -
        animatedPosition.value;
      return Math.min(1, offset / (diff - 100));
    });

    const renderBackdrop = useCallback(
      (props: BottomSheetDefaultBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          animatedIndex={myWackyIndex}
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

    const animatedIndex = useSharedValue(0);
    const itemMiniStyle = useAnimatedStyle(() => {
      return {
        opacity: 1 - animatedIndex.value,
      };
    });

    return (
      <BottomSheet
        ref={bsref}
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
        <SetBottomSheetSnapPointCount.Provider value={setActiveScreen}>
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
                  name="BottomSheetHelp"
                  component={HelpScreen}
                />
                <BottomSheetStackNavigator.Screen
                  name="BottomSheetHistoryOp"
                  component={HistoryOpScreen}
                />
              </BottomSheetStackNavigator.Group>
            </BottomSheetStackNavigator.Navigator>
          </SwipeContext.Provider>
        </SetBottomSheetSnapPointCount.Provider>
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

function HelpScreen() {
  const setBottomSheetSnapPointCount = useContext(SetBottomSheetSnapPointCount);
  const nav = useNav();
  const openL2BeatLink = () => {
    Linking.openURL("https://l2beat.com/scaling/projects/base");
  };

  const goBack = () => {
    if (nav.canGoBack()) {
      setBottomSheetSnapPointCount(ACTIVE_BOTTOM_SHEET_SCREEN.HISTORY);
      nav.goBack();
    }
  };

  return (
    <View style={ss.container.padH16}>
      <Spacer h={16} />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <TouchableOpacity onPress={goBack}>
          <Octicons name="arrow-left" size={30} color={color.midnight} />
        </TouchableOpacity>
        <TextCenter>
          <TextH3>Why was I charged zero fees?</TextH3>
        </TextCenter>
        <Spacer w={30} />
      </View>
      <Spacer h={12} />
      <TextLight>Daimo uses Base, an Ethereum rollup.</TextLight>
      <Spacer h={24} />
      <TextLight>
        Daimo transactions are sponsored. This means that your transfers are
        free.
      </TextLight>
      <Spacer h={24} />
      <TouchableOpacity onPress={openL2BeatLink}>
        <TextLink>Learn more on L2Beat.</TextLink>
      </TouchableOpacity>
      <Spacer h={32} />
      <ButtonMed title="GOT IT" onPress={goBack} type="subtle" />
      <Spacer h={24} />
    </View>
  );
}

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
