"use client";

import {
  DaimoRequestState,
  DaimoRequestV2Status,
  TagRedirectEvent,
  dollarsToAmount,
  parseDaimoLink,
  timeAgo,
} from "@daimo/common";
import { useCallback, useEffect, useState } from "react";
import { Address } from "viem";

import { Spacer } from "../../components/layout";
import { TextBold, TextH1, TextH3Subtle } from "../../components/typography";
import { rpcHook } from "../../utils/rpcHook";

export interface POSItem {
  name: string;
  price: number;
}

export function PointOfSalePage({
  tag,
  updateToken,
  title,
  items,
  storeAddress,
}: {
  tag: string;
  updateToken: string;
  title: string;
  items: POSItem[];
  storeAddress: Address;
}) {
  // Get history
  const queryHist = rpcHook.trpc.getTagHistory.useQuery({ tag });
  const refetch = useCallback(() => queryHist.refetch(), [queryHist]);

  return (
    <main className="max-w-md mx-auto py-8 flex flex-col items-stretch">
      <TextH1>{title}</TextH1>
      <Spacer h={32} />
      <NewOrderForm
        {...{ items, tag, updateToken, storeAddress }}
        onCreated={refetch}
      />
      <Spacer h={32} />
      <RecentOrders orders={queryHist.data} />
    </main>
  );
}

function NewOrderForm({
  items,
  tag,
  updateToken,
  storeAddress,
  onCreated,
}: {
  items: POSItem[];
  tag: string;
  updateToken: string;
  storeAddress: Address;
  onCreated: () => void;
}) {
  const [order, setOrder] = useState<POSItem[]>([]);

  // Track order in progress
  const total = order.reduce((acc, item) => acc + item.price, 0);

  // Place order
  // const mutCreateReq = rpcHook.trpc.createRequestSponsored.useMutation();
  const mut = rpcHook.trpc.updateTagToNewRequest.useMutation();
  const placeOrder = () => {
    const recipient = storeAddress;
    const amount = "" + dollarsToAmount(total);
    mut.mutate({ tag, updateToken, recipient, amount });
  };

  // Reset after placing order
  useEffect(() => {
    if (!mut.isSuccess) return;
    console.log(`✅ order successful: ${mut.data}`);
    onCreated();
    setTimeout(() => {
      setOrder([]);
      mut.reset();
    }, 1200);
  });

  return (
    <div className="flex flex-col items-stretch">
      <TextH3Subtle>New Order</TextH3Subtle>
      <Spacer h={16} />
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <AddItemButton key={item.name} {...{ item, order, setOrder }} />
        ))}
      </div>
      <Spacer h={16} />
      <TextH1>Total: ${total.toFixed(2)}</TextH1>
      <Spacer h={32} />
      <button
        className="bg-grayLight rounded-lg p-4 flex flex-col items-center disabled:opacity-25"
        onClick={placeOrder}
        disabled={mut.isLoading || mut.isSuccess || order.length === 0}
      >
        <TextBold>Place Order</TextBold>
      </button>
      <Spacer h={8} />
      <center>
        {mut.isIdle && <TextBold>&nbsp;</TextBold>}
        {mut.isLoading && <TextBold>...</TextBold>}
        {mut.isSuccess && <TextBold>✅ ordered</TextBold>}
        {mut.isError && <TextBold>❌ {mut.error.message}</TextBold>}
      </center>
    </div>
  );
}

function AddItemButton({
  item,
  order,
  setOrder,
}: {
  item: POSItem;
  order: POSItem[];
  setOrder: (order: POSItem[]) => void;
}) {
  const add = useCallback(
    () => setOrder([...order, item]),
    [setOrder, order, item]
  );
  const sub = useCallback(() => {
    const i = order.findIndex((i) => i.name === item.name);
    if (i === -1) return;
    const copy = order.slice();
    copy.splice(i, 1);
    setOrder(copy);
  }, [order, setOrder, item.name]);

  const count = order.filter((i) => i.name === item.name).length;
  const col = count > 0 ? "bg-primaryLight" : "bg-grayLight";

  return (
    <button
      className={`${col} w-36 h-24 rounded-lg py-4 flex flex-col items-center gap-2 select-none`}
      onClick={count === 0 ? add : undefined}
    >
      <TextBold>{item.name}</TextBold>
      {count === 0 && <TextH1>${item.price.toFixed(2)}</TextH1>}
      {count > 0 && (
        <div className="flex flex-row text-[1.75rem] font-semibold">
          <button className="px-5" onClick={sub}>
            -
          </button>
          <div>{count}</div>
          <button className="px-5" onClick={add}>
            +
          </button>
        </div>
      )}
    </button>
  );
}

function RecentOrders({ orders }: { orders?: TagRedirectEvent[] }) {
  return (
    <div>
      <TextH3Subtle>Recent Orders</TextH3Subtle>
      <Spacer h={16} />
      {orders == null && <TextBold>Loading...</TextBold>}
      {orders?.length === 0 && <TextBold>No orders yet</TextBold>}
      <div className="flex flex-col gap-4">
        {orders?.map((order, index) => (
          <Order key={order.time} order={order} index={index} />
        ))}
      </div>
    </div>
  );
}

function Order({ order, index }: { order: TagRedirectEvent; index: number }) {
  const [isPolling, setIsPolling] = useState(true);
  const query = rpcHook.trpc.getLinkStatus.useQuery(
    { url: order.link },
    { refetchInterval: isPolling ? 1000 : undefined }
  );
  const { data, isError } = query;
  const stat =
    data && data.link.type === "requestv2"
      ? (data as DaimoRequestV2Status)
      : null;

  // Once order is complete, stop polling
  useEffect(() => {
    if (stat == null) return;
    if (stat.status !== DaimoRequestState.Fulfilled) return;
    setIsPolling(false);
  }, [stat]);

  // Parse link. Ignore if not a request
  const link = parseDaimoLink(order.link);
  if (link == null || link.type !== "requestv2") return null;

  // Show error if loading status failed
  if (isError) {
    return <div>❌ {query.error.message}</div>;
  }

  // Display whether order is paid
  const font = `font-semibold  ` + (index === 0 ? `text-xl` : `text-md`);
  return (
    <div className={`flex flex-row ${font} text-midnight gap-4`}>
      <div className="w-12 text-center">
        {stat?.status === DaimoRequestState.Pending && "🟡"}
        {stat?.status === DaimoRequestState.Created && "🟡"}
        {stat?.status === DaimoRequestState.Fulfilled && "✅"}
        {stat?.status === DaimoRequestState.Cancelled && "❌"}
      </div>
      <div className="w-32">Order</div>
      <div className="w-16 text-right">${Number(link.dollars).toFixed(2)}</div>
      <div className="w-16 text-center">{timeAgo(order.time)}</div>
      <div className="w-16 text-center">
        <a className="text-primary" href={order.link} target="_blank">
          link
        </a>
      </div>
    </div>
  );
}
