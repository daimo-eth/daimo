import React, { useEffect, useRef } from "react";
import {
  View,
  Image,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
} from "react-native";

/**
 * Doge skin background
 */

const { width, height } = Dimensions.get("window");

const DOGE_SIZE = 50; // Fixed size for each doge
const ROW_HEIGHT = 60;
const ANIMATION_DURATION = 2500; // Duration for one complete cycle (adjust for speed)

const MovingDogeRow = ({ y, moveRight }: { y: number; moveRight: boolean }) => {
  const moveAnim = useRef(new Animated.Value(moveRight ? 0 : -width)).current;

  useEffect(() => {
    const animate = () => {
      Animated.timing(moveAnim, {
        toValue: moveRight ? -width : 0,
        duration: ANIMATION_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          moveAnim.setValue(moveRight ? 0 : -width);
          animate();
        }
      });
    };
    animate();
  }, [moveRight]);

  const dogesPerRow = Math.ceil(width / DOGE_SIZE) + 1;
  const totalDoges = dogesPerRow * 2;

  return (
    <Animated.View
      style={[
        styles.row,
        {
          transform: [{ translateX: moveAnim }],
          top: y,
        },
      ]}
    >
      {Array.from({ length: totalDoges }).map((_, index) => (
        <Image
          key={index}
          source={require("../../../../assets/skins/doge.png")}
          style={styles.doge}
        />
      ))}
    </Animated.View>
  );
};

const DogeBackground = ({ overlayOpacity = 0.5, overlayColor = "white" }) => {
  const rowCount = Math.ceil(height / ROW_HEIGHT);

  return (
    <View style={styles.container}>
      {Array.from({ length: rowCount }).map((_, index) => (
        <MovingDogeRow
          key={index}
          y={index * ROW_HEIGHT}
          moveRight={index % 2 === 0}
        />
      ))}
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: overlayColor,
            opacity: overlayOpacity,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  row: {
    position: "absolute",
    flexDirection: "row",
    width: width * 2,
    justifyContent: "space-around",
  },
  doge: {
    width: DOGE_SIZE,
    height: DOGE_SIZE,
    resizeMode: "contain",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default DogeBackground;
