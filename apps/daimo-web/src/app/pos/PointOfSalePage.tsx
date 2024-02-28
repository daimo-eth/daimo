"use client";

import {
  DaimoRequestState,
  DaimoRequestV2Status,
  TagRedirectEvent,
  dollarsToAmount,
  now,
  parseDaimoLink,
  timeAgo,
} from "@daimo/common";
import { useCallback, useEffect, useState } from "react";
import { Address } from "viem";

import { Spacer } from "../../components/layout";
import {
  TextBold,
  TextError,
  TextH1,
  TextH3Subtle,
} from "../../components/typography";
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

  const { data, isError, error } = queryHist;
  const time1HAgo = now() - 60 * 60;
  const orders = data && data.filter((o) => o.time > time1HAgo);

  return (
    <main className="max-w-md mx-auto py-8 flex flex-col items-stretch relative px-[4%]">
      <TextH1>{title}</TextH1>
      <Spacer h={32} />
      <NewOrderForm
        {...{ items, tag, updateToken, storeAddress }}
        onCreated={refetch}
      />
      <Spacer h={32} />
      {isError && <TextError>{error.message}</TextError>}
      {!isError && <RecentOrders orders={orders} />}
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

    // Format memo, eg "cappucino, 2x iced coffee"
    const itenNames = new Set(order.map((item) => item.name));
    const parts = [];
    for (const name of itenNames) {
      const count = order.filter((item) => item.name === name).length;
      if (count === 1) parts.push(`${name}`);
      else parts.push(`${count}x ${name}`);
    }
    const memo = parts.join(", ");

    mut.mutate({ tag, updateToken, recipient, amount, memo });
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
      <TextH3Subtle>NEW ORDER</TextH3Subtle>
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
        <TextH1>Place Order</TextH1>
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
      className={`${col} w-[30%] h-24 rounded-lg py-4 flex flex-col items-center gap-2 select-none`}
      onClick={count === 0 ? add : undefined}
    >
      <p className="ext-md font-semibold text-midnight  whitespace-nowrap text-ellipsis">
        {item.name}
      </p>
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
  // Poll order completion status
  const urls = orders?.map((order) => order.link) || [];
  const query = rpcHook.trpc.getLinkStatusBatch.useQuery(
    { urls },
    { refetchInterval: 1000, enabled: urls.length > 0 }
  );
  const { data, error, isError } = query;

  const reqStatuses = (data || []).map((d) => {
    if (d.link.type !== "requestv2") return null;
    return d as DaimoRequestV2Status;
  });

  return (
    <div>
      <TextH3Subtle>LATEST ORDERS</TextH3Subtle>
      <Spacer h={16} />
      {orders == null && <TextBold>Loading...</TextBold>}
      {isError && <TextError>{error.message}</TextError>}
      {orders?.length === 0 && <TextBold>No orders yet</TextBold>}
      <div className="flex flex-col gap-4">
        {orders?.map((order, index) => (
          <Order
            key={order.time}
            order={order}
            index={index}
            stat={reqStatuses[index]}
          />
        ))}
      </div>
    </div>
  );
}

function Order({
  order,
  index,
  stat,
}: {
  order: TagRedirectEvent;
  index: number;
  stat: DaimoRequestV2Status | null;
}) {
  // Parse link. Ignore if not a request
  const link = parseDaimoLink(order.link);
  if (link == null || link.type !== "requestv2") return null;

  // Track status
  const isOrdered =
    stat?.status === DaimoRequestState.Pending ||
    stat?.status === DaimoRequestState.Created;
  const isFulfilled = stat?.status === DaimoRequestState.Fulfilled;
  const isCancelled = stat?.status === DaimoRequestState.Cancelled;

  // Display whether order is paid
  const font = `font-semibold  text-xl`; // + (index === 0 ? `text-xl` : `text-md`);
  return (
    <div className={`flex flex-row ${font} text-midnight gap-4 items-center`}>
      <div className="w-12 text-center">
        {stat == null && <TextBold>⋯</TextBold>}
        {isOrdered && "🟡"}
        {isFulfilled && "✅"}
        {isCancelled && "❌"}
      </div>
      <div className="w-52">
        <p className={"text-sm font-semibold text-midnight"}>
          {isOrdered && "Unpaid"}
          {isFulfilled && "Paid"}
          {isCancelled && "Cancelled"}
        </p>
        <p className={"overflow-hidden whitespace-nowrap text-ellipsis"}>
          {link.memo || ""}
        </p>
      </div>
      <div className="w-16 text-right">
        <TextBold>{timeAgo(order.time, now(), true)}</TextBold>$
        {Number(link.dollars).toFixed(2)}
      </div>
      <div className="w-16 text-right">
        <a className="text-primary" href={order.link} target="_blank">
          link
        </a>
      </div>
    </div>
  );
}
