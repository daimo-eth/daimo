import { SuggestedAction } from "@daimo/api";
import { OpStatus } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { addEventListener } from "expo-linking";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  TouchableHighlight,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DispatcherContext } from "../../action/dispatch";
import { useWarmSenderCache } from "../../action/useSendAsync";
import { handleDeepLink, useNav } from "../../common/nav";
import { useAccount } from "../../logic/accountManager";
import { getInitialDeepLink } from "../../logic/deeplink";
import { useOnboardingChecklist } from "../../logic/onboarding";
import { useContactsPermission } from "../../logic/systemContacts";
import { Account } from "../../model/account";
import { useNetworkState } from "../../sync/networkState";
import { resync } from "../../sync/sync";
import { TitleAmount } from "../shared/Amount";
import { HistoryListSwipe } from "../shared/HistoryList";
import { Icon } from "../shared/Icon";
import { OctName } from "../shared/InputBig";
import { OfflineHeader } from "../shared/OfflineHeader";
import { SearchHeader } from "../shared/SearchHeader";
import { SearchResults } from "../shared/SearchResults";
import Spacer from "../shared/Spacer";
import { SuggestedActionBox } from "../shared/SuggestedActionBox";
import { SwipeUpDownRef } from "../shared/SwipeUpDown";
import { color, ss, touchHighlightUnderlay } from "../shared/style";
import { DaimoText, TextBody, TextLight } from "../shared/text";
import { useSwipeUpDown } from "../shared/useSwipeUpDown";
import { useWithAccount } from "../shared/withAccount";

export default function HomeScreen() {
  const Inner = useWithAccount(HomeScreenPullToRefreshWrap);
  return <Inner />;
}

// The whole screen (HomeScreenInner) can be pulled down to refresh.
function HomeScreenPullToRefreshWrap({ account }: { account: Account }) {
  // Pull-to-refresh state
  const scrollRef = useRef<Animated.ScrollView>(null);
  const isScrollDragged = useRef<boolean>(false);
  const bottomSheetRef = useRef<SwipeUpDownRef>(null);
  const translationY = useSharedValue(0);

  // Hack to prevent pull-to-refresh from moving up instead of down.
  const preventOverscrollOffset = useSharedValue(0);

  console.log(
    `[HOME] rendering ${account.name}, ${account.recentTransfers.length} ops`
  );

  // For speed, preload DaimoOpSender
  useWarmSenderCache(account);

  // Show search results when search is focused.
  const [searchPrefix, setSearchPrefix] = useState<string | undefined>();

  // Outer scroll: pull to refresh
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await resync("Home screen pull refresh");
    setRefreshing(false);
    if (scrollRef.current && !isScrollDragged.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, []);

  const onScrollBeginDrag = () => {
    isScrollDragged.current = true;
  };
  const onScrollEndDrag = () => {
    isScrollDragged.current = false;
    if (scrollRef.current && !refreshing) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  };
  const scrollHandler = useAnimatedScrollHandler((event) => {
    if (event.contentOffset.y < 0) {
      translationY.value = event.contentOffset.y;
    } else {
      translationY.value = 0;
      preventOverscrollOffset.value = event.contentOffset.y;
    }
  });

  // Hack to prevent pull-to-refresh from moving up instead of down.
  const preventOverscrollStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: preventOverscrollOffset.value }],
  }));

  // Re-render HistoryListSwipe only transfer count or status changes.
  const statusCountsStr = JSON.stringify(
    Object.keys(OpStatus).map((key) => [
      key,
      account.recentTransfers.filter(({ status }) => status === key).length,
    ])
  );
  const histListMini = useMemo(
    () => <HistoryListSwipe account={account} showDate={false} maxToShow={5} />,
    [statusCountsStr]
  );
  const histListFull = useMemo(
    () => <HistoryListSwipe account={account} showDate />,
    [statusCountsStr]
  );

  // Show history
  const { bottomSheet, isBottomSheetOpen } = useSwipeUpDown({
    itemMini: histListMini,
    itemFull: histListFull,
    translationY,
    disabled: refreshing,
    bottomSheetRef,
  });

  // Handle incoming applinks
  useInitNavLinks();

  return (
    <View>
      <OfflineHeader dontTakeUpSpace offlineExtraMarginBottom={16} />
      <Animated.ScrollView
        ref={scrollRef}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        scrollToOverflowEnabled={false}
        scrollsToTop={false}
        scrollEnabled={searchPrefix == null && !isBottomSheetOpen}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.animatedScrollContent}
        style={styles.scrollView}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onScroll={scrollHandler}
        scrollEventThrottle={8}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={preventOverscrollStyle}>
          <HomeScreenInner {...{ account, searchPrefix, setSearchPrefix }} />
        </Animated.View>
      </Animated.ScrollView>
      {searchPrefix == null && bottomSheet}
    </View>
  );
}

function HomeScreenInner({
  account,
  searchPrefix,
  setSearchPrefix,
}: {
  account: Account;
  searchPrefix?: string;
  setSearchPrefix: (prefix?: string) => void;
}) {
  const ins = useSafeAreaInsets();

  const contactsAccess = useContactsPermission();

  const cta = useHomeCTA(account);

  return (
    <View>
      <Spacer h={Math.max(16, ins.top)} />
      <SearchHeader prefix={searchPrefix} setPrefix={setSearchPrefix} />
      {searchPrefix != null && (
        <SearchResults
          contactsAccess={contactsAccess}
          prefix={searchPrefix}
          mode="account"
        />
      )}
      {searchPrefix == null && account != null && (
        <>
          <Spacer h={cta == null ? 64 : 24} />
          {cta && cta.type === "onboardingChecklist" && <CompleteOnboarding />}
          {cta && cta.type === "suggestedAction" && (
            <SuggestedActionBox action={cta.action} onHideAction={cta.onHide} />
          )}
          <Spacer h={32} />
          <AmountAndButtons account={account} />
        </>
      )}
    </View>
  );
}

type HomeCTA =
  | { type: "onboardingChecklist" }
  | { type: "suggestedAction"; action: SuggestedAction; onHide: () => void };

// Get the home screen call-to-action, if any.
function useHomeCTA(account: Account): HomeCTA | null {
  // No suggested actions when offline.
  const netState = useNetworkState();

  // Suggested action: either from account, or the onboarding checklist.
  const { allComplete } = useOnboardingChecklist(account);

  // Show suggested action when available, shortly after loading.
  const [isActionVisible, setIsActionVisible] = useState(true);
  const onHide = () => setIsActionVisible(false);

  if (netState.status === "offline") return null;
  if (!allComplete) return { type: "onboardingChecklist" };

  const { suggestedActions } = account;
  if (!isActionVisible) return null;
  if (suggestedActions.length === 0) return null;
  return { type: "suggestedAction", action: suggestedActions[0], onHide };
}

function AmountAndButtons({ account }: { account: Account }) {
  const nav = useNav();
  const goSend = useCallback(
    () =>
      nav.navigate("SendTab", {
        screen: "SendNav",
        params: { autoFocus: true },
      }),
    [nav]
  );
  const goRequest = useCallback(
    () =>
      nav.navigate("HomeTab", {
        screen: "ReceiveNav",
      }),
    [nav]
  );
  const goDeposit = useCallback(() => nav.navigate("DepositTab"), [nav]);

  const isEmpty = account.lastBalance === 0n;

  return (
    <TouchableWithoutFeedback>
      <View style={styles.amountAndButtons}>
        <TextLight>Your balance</TextLight>
        <TitleAmount amount={account.lastBalance} />
        <Spacer h={16} />
        <View style={styles.buttonRow}>
          <IconButton title="Deposit" onPress={goDeposit} />
          <IconButton title="Request" onPress={goRequest} />
          <IconButton title="Send" onPress={goSend} disabled={isEmpty} />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

function IconButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const name: OctName = (function () {
    switch (title) {
      case "Deposit":
        return "plus";
      case "Request":
        return "download";
      case "Send":
        return "paper-airplane";
      default:
        return "question";
    }
  })();

  return (
    <View style={styles.iconButtonWrap}>
      <TouchableHighlight
        disabled={disabled}
        onPress={disabled ? undefined : onPress}
        style={disabled ? styles.iconButtonDisabled : styles.iconButton}
        hitSlop={16}
        {...touchHighlightUnderlay.primary}
      >
        <Octicons name={name} size={24} color={color.white} />
      </TouchableHighlight>
      <Spacer h={8} />
      <View style={disabled ? styles.iconLabelDisabled : styles.iconLabel}>
        <TextBody>{title}</TextBody>
      </View>
    </View>
  );
}

function CompleteOnboarding() {
  const dispatcher = useContext(DispatcherContext);

  const openChecklist = useCallback(() => {
    dispatcher.dispatch({ name: "onboardingChecklist" });
  }, [dispatcher]);

  return (
    <Pressable
      onPress={openChecklist}
      style={({ pressed }) => [
        {
          ...styles.checklistAction,
          backgroundColor: pressed
            ? touchHighlightUnderlay.subtle.underlayColor
            : undefined,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Icon name="list" size={24} color={color.gray3} />
        <Spacer w={12} />
        <DaimoText variant="body">Finish setting up your account</DaimoText>
      </View>
      <Octicons size={24} color={color.primary} name="arrow-right" />
    </Pressable>
  );
}

let handledInitialDeepLink = false;

/** Handle incoming app deep links. */
function useInitNavLinks() {
  const nav = useNav();
  const [account] = useAccount();
  const accountMissing = account == null;

  // Handle deeplinks
  useEffect(() => {
    if (accountMissing) return;

    const currentTab = nav.getState().routes[0]?.name || "";
    console.log(`[NAV] ready to init? current tab: ${currentTab}`);
    if (!currentTab.startsWith("Home")) return;

    console.log(`[NAV] listening for deep links, account ${account.name}`);
    getInitialDeepLink().then((url) => {
      if (url == null) return;
      if (handledInitialDeepLink) return;
      handledInitialDeepLink = true;
      handleDeepLink(nav, url);
    });

    const sub = addEventListener("url", ({ url }) => handleDeepLink(nav, url));
    return () => sub.remove();
  }, [accountMissing, nav]);
}

const iconButton = {
  backgroundColor: color.primary,
  height: 64,
  width: 64,
  borderRadius: 64,
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
} as const;

const iconLabel = {
  alignSelf: "stretch",
  flexDirection: "row",
  justifyContent: "center",
} as const;

const styles = StyleSheet.create({
  amountAndButtons: {
    flexDirection: "column",
    alignItems: "center",
  },
  scrollView: {
    height: "100%",
  },
  animatedScrollContent: {
    height: "100%",
  },
  buttonRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
  },
  iconButtonWrap: {
    borderRadius: 16,
    paddingVertical: 16,
    width: 96,
    flexDirection: "column",
    alignItems: "center",
  },
  iconButton,
  iconButtonDisabled: {
    ...iconButton,
    opacity: 0.5,
  },
  iconLabel,
  iconLabelDisabled: {
    ...iconLabel,
    opacity: 0.5,
  },
  checklistAction: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.grayLight,
    marginHorizontal: 24,
    backgroundColor: color.white,
    ...ss.container.shadow,
  },
});
