import { useEffect, useState } from "react";
import { Keyboard } from "react-native";

export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  useEffect(() => {
    const l1 = Keyboard.addListener("keyboardDidShow", keyboardDidShow);
    const l2 = Keyboard.addListener("keyboardDidHide", keyboardDidHide);

    // cleanup function
    return () => {
      l1.remove();
      l2.remove();
    };
  }, []);

  const keyboardDidShow = (frames: any) => {
    setKeyboardHeight(frames.endCoordinates.height);
  };

  const keyboardDidHide = () => {
    setKeyboardHeight(0);
  };

  return keyboardHeight;
}
