import { DaimoLink } from "@daimo/common";
import { baseUSDC } from "@daimo/contract";

import { Dispatcher } from "../src/action/dispatch";
import { MainNav, handleDeepLink } from "../src/common/nav";

describe("nav", () => {
  const history = [] as { tab: string; screen: string; params: any }[];
  const dispatcherHistory = [] as { name: string; params: any }[];
  const nav: MainNav = {
    navigate: (
      tab: string,
      { screen, params }: { screen: string; params: any }
    ) => {
      history.push({ tab, screen, params });
    },
  } as any;

  const dispatcher: Dispatcher = {
    dispatch: ({ name, params }: { name: string; params: any }) =>
      dispatcherHistory.push({ name, params }),
  } as any;

  const assertNav = (
    tab: string,
    screen: string,
    params: { link: DaimoLink }
  ) => {
    expect(history).toStrictEqual([{ tab, screen, params }]);
  };

  it("handles account links", () => {
    history.length = 0;
    handleDeepLink(nav, dispatcher, "daimo://account/alice", 8453);
    assertNav("HomeTab", "Profile", {
      link: { type: "account", account: "alice" },
    });
  });

  it("handles request links", () => {
    history.length = 0;
    handleDeepLink(nav, dispatcher, "daimo://request/alice/1.23/456", 8453);
    assertNav("SendTab", "SendTransfer", {
      link: {
        type: "request",
        recipient: "alice",
        dollars: "1.23",
        requestId: "456",
        toCoin: baseUSDC,
      },
    });
  });

  it("handles payment links", () => {
    history.length = 0;
    handleDeepLink(
      nav,
      dispatcher,
      "daimo://note/alice/1.23/0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
      8453
    );
    assertNav("HomeTab", "Note", {
      link: {
        type: "note",
        previewSender: "alice",
        previewDollars: "1.23",
        ephemeralOwner: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        ephemeralPrivateKey: undefined,
      },
    });
  });
});
