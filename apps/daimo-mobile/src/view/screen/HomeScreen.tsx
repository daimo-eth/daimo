import {
  SuggestedAction,
  TransferSwapClog,
  amountToDollars,
  getTransferClogStatus,
} from "@daimo/common";
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

import { HistoryListSwipe } from "./history/HistoryList";
import { DispatcherContext } from "../../action/dispatch";
import { handleDeepLink, useNav } from "../../common/nav";
import { i18n } from "../../i18n";
import { useAccount } from "../../logic/accountManager";
import { getInitialDeepLink } from "../../logic/deeplink";
import { useOnboardingChecklist } from "../../logic/onboarding";
import { useWarmDeviceKeySenderCache } from "../../logic/opSender";
import { useContactsPermission } from "../../logic/systemContacts";
import { Account } from "../../storage/account";
import { useNetworkState } from "../../sync/networkState";
import { resync } from "../../sync/sync";
import { TitleAmount } from "../shared/Amount";
import { Icon } from "../shared/Icon";
import { OctName } from "../shared/InputBig";
import { OfflineHeader } from "../shared/OfflineHeader";
import { SearchHeader } from "../shared/SearchHeader";
import { SearchResults } from "../shared/SearchResults";
import Spacer from "../shared/Spacer";
import { SuggestedActionBox } from "../shared/SuggestedActionBox";
import { SwipeUpDownRef } from "../shared/SwipeUpDown";
import { DaimoText, TextBody, TextBtnCaps, TextLight } from "../shared/text";
import { useSwipeUpDown } from "../shared/useSwipeUpDown";
import { useWithAccount } from "../shared/withAccount";
import { ThemeBackground } from "../style/skinCover";
import { Colorway, SkinStyleSheet } from "../style/skins";
import { useTheme } from "../style/theme";

const i18 = i18n.home;

export default function HomeScreen() {
  const Inner = useWithAccount(HomeScreenPullToRefreshWrap);
  return <Inner />;
}

// The whole screen (HomeScreenInner) can be pulled down to refresh.
function HomeScreenPullToRefreshWrap({ account }: { account: Account }) {
  const { color, ss } = useTheme();
  const styles = useMemo(() => getStyles(color, ss), [color, ss]);

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
  useWarmDeviceKeySenderCache(account);

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
    account.recentTransfers.reduce((counts, transfer) => {
      let statusStr = getTransferClogStatus(transfer);
      const { offchainTransfer } = transfer as TransferSwapClog;
      statusStr += `-${offchainTransfer?.timeExpected}`;
      counts[statusStr] = (counts[statusStr] || 0) + 1;
      return counts;
    }, {} as Record<string, number>)
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
    <ThemeBackground hide={searchPrefix != null}>
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
    </ThemeBackground>
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
  const { color, ss } = useTheme();
  const styles = useMemo(() => getStyles(color, ss), [color, ss]);
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
  const goDeposit = useCallback(
    () =>
      nav.navigate("DepositTab", {
        screen: "Deposit",
      }),
    [nav]
  );

  const isEmpty = account.lastBalance === 0n;

  // sum over all proposed swaps toAmount
  const pendingDollars = amountToDollars(
    account.proposedSwaps.reduce((acc, swap) => acc + swap.toAmount, 0)
  );

  return (
    <TouchableWithoutFeedback accessible={false}>
      <View style={styles.amountAndButtons}>
        <TextLight>{i18.yourBalance()}</TextLight>
        <TitleAmount amount={account.lastBalance} />
        {Number(pendingDollars) > 0 && (
          <>
            <Spacer h={8} />
            <PendingTag pendingDollars={pendingDollars} />
          </>
        )}
        <Spacer h={16} />
        <View style={styles.buttonRow}>
          <IconButton type="Deposit" onPress={goDeposit} />
          <IconButton type="Request" onPress={goRequest} />
          <IconButton type="Send" onPress={goSend} disabled={isEmpty} />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

function PendingTag({ pendingDollars }: { pendingDollars: string }) {
  const nav = useNav();
  const { color, touchHighlightUnderlay } = useTheme();

  const onPress = () => nav.navigate("Notifications");
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      {({ pressed }) => (
        <View
          style={{
            borderRadius: 12,
            backgroundColor: pressed
              ? touchHighlightUnderlay.subtle.underlayColor
              : color.ivoryDark,
            paddingHorizontal: 16,
            paddingVertical: 4,
          }}
        >
          <TextBtnCaps color={color.grayDark}>
            {i18.pending(pendingDollars)}
          </TextBtnCaps>
        </View>
      )}
    </Pressable>
  );
}

function IconButton({
  type,
  onPress,
  disabled,
}: {
  type: "Deposit" | "Request" | "Send";
  onPress: () => void;
  disabled?: boolean;
}) {
  const { color, touchHighlightUnderlay, ss } = useTheme();
  const styles = useMemo(() => getStyles(color, ss), [color, ss]);

  const [name, title] = (function (): [OctName, string] {
    switch (type) {
      case "Deposit":
        return ["plus", i18.deposit()];
      case "Request":
        return ["arrow-down", i18.request()];
      case "Send":
        return ["paper-airplane", i18.send()];
      default:
        throw new Error(`unhandled IconButton "${type}"`);
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
  const { color, touchHighlightUnderlay, ss } = useTheme();
  const styles = useMemo(() => getStyles(color, ss), [color, ss]);

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
            : color.white,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Icon name="list" size={24} color={color.gray3} />
        <Spacer w={12} />
        <DaimoText variant="body">{i18.finishAccountSetUp()}</DaimoText>
      </View>
      <Octicons size={24} color={color.primary} name="arrow-right" />
    </Pressable>
  );
}

let handledInitialDeepLink = false;

/** Handle incoming app deep links. */
function useInitNavLinks() {
  const nav = useNav();
  const account = useAccount();
  const accountMissing = account == null;
  const dispatcher = useContext(DispatcherContext);

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
      handleDeepLink(nav, dispatcher, url, account.homeChainId);
    });

    const sub = addEventListener("url", ({ url }) =>
      handleDeepLink(nav, dispatcher, url, account.homeChainId)
    );
    return () => sub.remove();
  }, [accountMissing, nav]);
}

const iconLabel = {
  alignSelf: "stretch",
  flexDirection: "row",
  justifyContent: "center",
} as const;

const getStyles = (color: Colorway, ss: SkinStyleSheet) => {
  const iconButton = {
    backgroundColor: color.primary,
    height: 64,
    width: 64,
    borderRadius: 64,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  } as const;

  return StyleSheet.create({
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
      elevation: 0, // Android shadows are bugged with Pressable: https://github.com/facebook/react-native/issues/25093#issuecomment-789502424
    },
  });
};
