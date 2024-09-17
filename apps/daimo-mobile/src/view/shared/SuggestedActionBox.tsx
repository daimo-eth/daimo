import { SuggestedAction } from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import { TouchableOpacity } from "@gorhom/bottom-sheet";
import { useContext, useEffect, useMemo, useState } from "react";
import { GestureResponderEvent, Linking, StyleSheet, View } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { OctName } from "./InputBig";
import { TextBody, TextMeta } from "./text";
import { DispatcherContext } from "../../action/dispatch";
import { handleDeepLink, useNav } from "../../common/nav";
import { getAccountManager, useAccount } from "../../logic/accountManager";
import { getRpcFunc } from "../../logic/trpc";
import { Colorway } from "../style/skins";
import { useTheme } from "../style/theme";

export function SuggestedActionBox({
  action,
  onHideAction,
}: {
  action: SuggestedAction;
  onHideAction?(): void;
}) {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);
  const nav = useNav();
  const account = useAccount();
  const dispatcher = useContext(DispatcherContext);

  // Action to display
  const { icon, title, subtitle } = action;

  // UI state
  const [isVisible, setIsVisible] = useState(true);
  const x = useSharedValue(0);
  const y = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const xButtonPos = useSharedValue(0);
  const wasCancelled = useSharedValue(false);

  // Track when we do the action or dismiss it.
  const rpcFunc = getRpcFunc(daimoChainFromId(account!.homeChainId));

  // Press = do the suggested action.
  const onPress = () => {
    if (account == null) return;
    console.log(`[SUGGESTED] executing ${action.id}: ${action.title}`);

    if (action.url.startsWith("daimo")) {
      handleDeepLink(nav, dispatcher, action.url, account.homeChainId); // daimo:// direct deeplinks
    } else {
      Linking.openURL(action.url); // https://, mailto://, ...
    }

    rpcFunc.logAction.mutate({
      action: {
        accountName: account.name,
        name: "suggested-action-accept",
        keys: { "suggestion.id": action.id, "suggestion.title": action.title },
      },
    });
  };

  // Dismiss by tapping (x) or swiping
  const onDismiss = () => {
    if (account == null) return;
    console.log(`[SUGGESTED] dismissing ${action.id}: ${action.title}`);

    setIsVisible(false);
    onHideAction?.();
    getAccountManager().transform((account) => ({
      ...account,
      dismissedActionIDs: [...account.dismissedActionIDs, action.id],
      suggestedActions:
        account?.suggestedActions?.filter(
          (a: SuggestedAction) => a.id !== action.id
        ) || [],
    }));

    rpcFunc.logAction.mutate({
      action: {
        accountName: account.name,
        name: "suggested-action-dismiss",
        keys: { "suggestion.id": action.id, "suggestion.title": action.title },
      },
    });
  };

  const onPressX = (e: GestureResponderEvent) => {
    e?.stopPropagation();
    opacity.value = withTiming(0, {}, () => {
      runOnJS(onDismiss)();
    });
  };

  // Fade in/out
  useEffect(() => {
    if (isVisible) {
      y.value = withTiming(0);
      x.value = 0;
      opacity.value = withTiming(1);
    }
  }, [isVisible]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (event, ctx: { startX: number; eventCancelled: boolean }) => {
      ctx.eventCancelled = false;
      if (event.x > xButtonPos.value) {
        ctx.eventCancelled = true;
      }
      if (!ctx.eventCancelled) {
        scale.value = withTiming(0.98);
      }
      ctx.startX = x.value;
      wasCancelled.value = false;
    },
    onActive: (event, ctx: { startX: number }) => {
      const offset = ctx.startX + event.translationX;
      const frictionPower = 1 - offset / 300;
      if (offset > 0) {
        opacity.value = 1;
        if (frictionPower > 0.476) {
          x.value = offset * frictionPower;
        }
      } else {
        x.value = offset;
        opacity.value = 1 - Math.min(1, -offset / 200);
      }

      if (x.value < -10 || x.value > 10) {
        wasCancelled.value = true;
      }
    },
    onCancel: () => {
      scale.value = withTiming(1);
      x.value = withSpring(0);
      opacity.value = withTiming(1);
    },
    onFinish: (_, ctx: { eventCancelled: boolean }) => {
      if (!wasCancelled.value && !ctx.eventCancelled) {
        runOnJS(onPress)();
      } else {
        if (x.value < -20) {
          x.value = withSpring(-500, {}, () => {
            y.value = -100;
          });
          opacity.value = withTiming(0);
          runOnJS(onDismiss)();
        } else {
          x.value = withSpring(0);
          opacity.value = withTiming(1);
        }
        scale.value = withTiming(1);
      }
      wasCancelled.value = false;
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        {
          scale: scale.value,
        },
        {
          translateX: x.value,
        },
        {
          translateY: y.value,
        },
      ],
    };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.animatedWrapper, animatedStyle]}>
        <View
          style={styles.bubble}
          onLayout={(e) => {
            xButtonPos.value = e.nativeEvent.layout.width - 40;
          }}
        >
          <View style={styles.bubbleIcon}>
            {!icon && <TextBody color={color.white}>i</TextBody>}
            {icon && (
              <Octicons name={icon as OctName} size={16} color={color.white} />
            )}
          </View>
          <View style={styles.bubbleText}>
            <TextMeta>{title}</TextMeta>
            <TextMeta color={color.grayDark}>{subtitle}</TextMeta>
          </View>
          <TouchableOpacity
            onPress={onPressX}
            style={styles.bubbleExit}
            hitSlop={16}
          >
            <Octicons name="x" size={24} color={color.grayDark} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
}

const getStyles = (color: Colorway) =>
  StyleSheet.create({
    animatedWrapper: {
      width: "100%",
      zIndex: 10000,
    },
    bubble: {
      backgroundColor: color.ivoryDark,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      gap: 16,
      marginHorizontal: 16,
      marginBottom: 16,
    },
    bubbleIcon: {
      backgroundColor: color.primary,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      width: 32,
      height: 32,
      borderRadius: 32,
    },
    bubbleExit: {
      alignSelf: "stretch",
      flexDirection: "column",
      justifyContent: "center",
      paddingRight: 12,
      marginRight: -8,
    },
    bubbleText: {
      flex: 1,
      flexDirection: "column",
    },
  });
