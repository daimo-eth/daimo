import React from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export function DuckBackground() {
  const numRows = 14;
  const numCols = 7;

  return (
    <View style={styles.container}>
      {[...Array(numRows * numCols)].map((_, index) => {
        const row = Math.floor(index / numCols);
        const col = index % numCols;
        return (
          <Image
            key={index}
            source={require("../../../../assets/skins/duck.png")}
            style={[
              styles.duck,
              {
                left: (width / numCols) * col,
                top: (height / numRows) * row,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  duck: {
    position: "absolute",
    width: 50,
    height: 50,
    opacity: 0.5,
  },
});
