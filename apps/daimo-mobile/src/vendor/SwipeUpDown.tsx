//
// Vendored from react-native-swipe-up-down
//
// https://github.com/react-native-vietnam/react-native-swipe-up-down
//
// MIT License
//
// Copyright (c) 2023-present, Daimo authors.
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

import React, { ReactNode, useRef, useState } from "react";
import {
  Dimensions,
  LayoutAnimation,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const springAnimation = {
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
  onShowMini,
  onShowFull,
  swipeHeight,
}: SwipeUpDownProps) {
  const ins = useSafeAreaInsets();
  console.log(`[SWIPE] ins ${JSON.stringify(ins)}`);

  const maxHeight = screenDimensions.height - ins.top - ins.bottom;
  const posYMini = maxHeight - swipeHeight;
  const posYFull = ins.top;
  const customStyle = {
    style: {
      bottom: 0,
      top: posYMini,
    } as { bottom: number; top: number; height?: number },
  };

  const viewRef = useRef<View>(null);
  const [isMini, setIsMini] = useState(true);

  const onPanResponderMove = (
    _: unknown,
    gestureState: PanResponderGestureState
  ) => {
    const baseY = isMini ? posYMini : posYFull;
    const newY = baseY + gestureState.dy;
    updatePosY(newY);
  };

  const onPanResponderRelease = (
    _: unknown,
    gestureState: PanResponderGestureState
  ) => {
    console.log(`[SWIPE] release ${isMini} ${gestureState.dy}`);
    const threshold = isMini ? -64 : 64;
    if (gestureState.dy > threshold) {
      showMini(); // Swiped down (or not far up enough), show mini view
    } else {
      showFull(); // Swiped up (or not far down enough), show full view
    }
  };

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (ev, g) => true,
        onPanResponderMove,
        onPanResponderRelease,
      }),
    [isMini]
  );

  const showFull = () => {
    console.log(`[SWIPE] showFull ${posYFull}`);
    updatePosY(posYFull);
    setIsMini(false);
    onShowFull?.();
  };

  const showMini = () => {
    console.log(`[SWIPE] showFull ${posYMini}`);
    updatePosY(posYMini);
    setIsMini(true);
    onShowMini?.();
  };

  const updatePosY = (y: number) => {
    customStyle.style.top = y;
    LayoutAnimation.configureNext(springAnimation);
    viewRef.current?.setNativeProps(customStyle);
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
          marginTop: 0,
        },
      ]}
    >
      {isMini ? itemMini : itemFull}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapSwipe: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
  },
});
