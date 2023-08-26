//
// Vendored from react-native-swipe-up-down
//
// https://github.com/react-native-vietnam/react-native-swipe-up-down
//
// MIT License
//
// Copyright (c) 2018-present, Duong Minh Chien.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//

import React, {
  ReactNode,
  Ref,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  LayoutAnimation,
  PanResponder,
  PanResponderGestureState,
  Platform,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

const MARGIN_TOP = Platform.OS === "ios" ? 24 : 0;
const DEVICE_HEIGHT = Dimensions.get("window").height - MARGIN_TOP;

const CustomAnimation = {
  duration: 300,
  create: {
    type: LayoutAnimation.Types.spring,
    property: LayoutAnimation.Properties.scaleY,
    springDamping: 0.8,
  },
  update: {
    type: LayoutAnimation.Types.spring,
    springDamping: 0.8,
  },
};

interface SwipeUpDownProps {
  swipeHeight?: number;
  extraMarginTop?: number;
  itemMini: ReactNode;
  itemFull: ReactNode;
  style?: ViewStyle;
  onShowMini?: () => void;
  onShowFull?: () => void;
  animation?: "linear" | "spring" | "easeInEaseOut";
}

const SwipeUpDown = (
  {
    swipeHeight = 60,
    extraMarginTop = MARGIN_TOP,
    itemMini,
    itemFull,
    style,
    onShowMini,
    onShowFull,
    animation = "spring",
  }: SwipeUpDownProps,
  ref: Ref<any>
) => {
  const maxHeight = DEVICE_HEIGHT - extraMarginTop;
  const MINI_POSITION = maxHeight - swipeHeight;
  const customStyle = {
    style: {
      bottom: 0,
      top: MINI_POSITION,
    } as { bottom: number; top: number; height?: number },
  };
  const checkCollapsed = useRef(true);
  const viewRef = useRef<View>(null);
  const [collapsed, setCollapsed] = useState(true);

  const onPanResponderMove = (
    _: unknown,
    gestureState: PanResponderGestureState
  ) => {
    if (gestureState.dy > 0 && !checkCollapsed.current) {
      // SWIPE DOWN
      customStyle.style.top = gestureState.dy;
      if (customStyle.style.height! <= DEVICE_HEIGHT / 3) {
        if (itemMini) {
          setCollapsed(true);
        }
      }
      updateNativeProps();
    } else if (checkCollapsed.current && gestureState.dy < -swipeHeight) {
      // SWIPE UP
      customStyle.style.top = DEVICE_HEIGHT + gestureState.dy;
      if (customStyle.style.top <= DEVICE_HEIGHT / 2) {
        setCollapsed(false);
      }
      updateNativeProps();
    }
  };

  const onPanResponderRelease = (
    _: unknown,
    gestureState: PanResponderGestureState
  ) => {
    if (gestureState.dy < -100 || gestureState.dy < 100) {
      showFull();
    } else {
      showMini();
    }
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (ev, g) => true,
      onPanResponderMove,
      onPanResponderRelease,
    })
  ).current;

  const showFull = () => {
    customStyle.style.top = extraMarginTop;
    updateNativeProps();
    setCollapsed(false);
    checkCollapsed.current = false;
    onShowFull?.();
  };

  const showMini = () => {
    customStyle.style.top = MINI_POSITION;
    updateNativeProps();
    setCollapsed(true);
    checkCollapsed.current = true;
    onShowMini?.();
  };

  useImperativeHandle(
    ref,
    () => ({
      showFull,
      showMini,
    }),
    []
  );

  const updateNativeProps = () => {
    switch (animation) {
      case "linear":
        LayoutAnimation.linear();
        break;
      case "spring":
        LayoutAnimation.configureNext(CustomAnimation);
        break;
      case "easeInEaseOut":
        LayoutAnimation.easeInEaseOut();
        break;
      default:
        break;
    }
    // viewRef.current?.setNativeProps(customStyle);
  };

  return (
    <View
      ref={viewRef}
      {...panResponder.panHandlers}
      style={[
        styles.wrapSwipe,
        {
          top: customStyle.style.top,
          height: maxHeight,
          marginTop: extraMarginTop,
        },
        !itemMini && collapsed && { marginBottom: -swipeHeight },
        style,
      ]}
    >
      {collapsed ? itemMini : itemFull}
    </View>
  );
};

export default forwardRef(SwipeUpDown);

const styles = StyleSheet.create({
  wrapSwipe: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
  },
});
