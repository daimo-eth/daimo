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

import { Spacer } from "../../components/Spacer";
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
  storeAddress,
}: {
  tag: string;
  updateToken: string;
  title?: string;
  storeAddress: Address;
}) {
  // Get history
  const queryHist = rpcHook.trpc.getTagHistory.useQuery({ tag });
  const refetch = useCallback(() => queryHist.refetch(), [queryHist]);

  const { data, isError, error } = queryHist;

  return (
    <main className="max-w-md mx-auto py-8 flex flex-col items-stretch px-[4%] text-midnight">
      {title && <TextH1>{title}</TextH1>}
      {title && <Spacer h={32} />}
      <NewOrderForm
        {...{ tag, updateToken, storeAddress }}
        onCreated={refetch}
      />
      <Spacer h={16} />
      {isError && <TextError>{error.message}</TextError>}
      {!isError && <RecentOrders orders={data} />}
    </main>
  );
}

function NewOrderForm({
  tag,
  updateToken,
  storeAddress,
  onCreated,
}: {
  tag: string;
  updateToken: string;
  storeAddress: Address;
  onCreated: () => void;
}) {
  const [euros, setEuros] = useState(0);
  const dollars = (euros * 1.08).toFixed(2);

  // Place order
  // const mutCreateReq = rpcHook.trpc.createRequestSponsored.useMutation();
  const mut = rpcHook.trpc.updateTagToNewRequest.useMutation();
  const placeOrder = () => {
    const recipient = storeAddress;
    const amount = "" + dollarsToAmount(dollars);

    // Format memo, eg "€ 1.08 • Jeff's Coffee"
    const memo = "€ " + euros.toFixed(2) + " • Jeff's Coffee";

    mut.mutate({ tag, updateToken, recipient, amount, memo });
  };

  // Reset after placing order
  useEffect(() => {
    if (!mut.isSuccess) return;
    console.log(`✅ order successful: ${mut.data}`);
    onCreated();
    setTimeout(() => {
      setEuros(0);
      mut.reset();
    }, 1200);
  });

  return (
    <div className="flex flex-col items-stretch">
      <TextH3Subtle>NEW ORDER</TextH3Subtle>
      <Spacer h={16} />
      <div className="flex flex-wrap gap-2 justify-center">
        <InputNumber euros={euros} setEuros={setEuros} />
      </div>
      <Spacer h={16} />
      <TextH1>
        Total: €{euros.toFixed(2)} ~ ${dollars}
      </TextH1>
      <Spacer h={16} />
      <button
        className="bg-grayLight rounded-lg p-4 flex flex-col items-center disabled:opacity-25"
        onClick={placeOrder}
        disabled={mut.isPending || mut.isSuccess || euros === 0}
      >
        <TextH1>Place Order</TextH1>
      </button>
      <Spacer h={8} />
      <center>
        {mut.isIdle && <TextBold textColor="text-midnight">&nbsp;</TextBold>}
        {mut.isPending && <TextBold textColor="text-midnight">...</TextBold>}
        {mut.isSuccess && (
          <TextBold textColor="text-midnight">✅ ordered</TextBold>
        )}
        {mut.isError && (
          <TextBold textColor="text-midnight">❌ {mut.error.message}</TextBold>
        )}
      </center>
    </div>
  );
}

function InputNumber({
  euros,
  setEuros,
}: {
  euros: number;
  setEuros: (value: number) => void;
}) {
  return (
    <div className="ext-md text-[3rem] font-semibold text-midnight whitespace-nowrap text-ellipsis flex justify-center items-center mb-8">
      <span className="mr-2">€</span>
      <input
        className="w-32 text-center"
        type="number"
        placeholder="0"
        min="0"
        value={euros > 0 ? euros : ""}
        onChange={(e) => setEuros(Number(e.target.value))}
      />
    </div>
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
      {orders == null && (
        <TextBold textColor="text-midnight">Loading...</TextBold>
      )}
      {isError && <TextError>{error.message}</TextError>}
      {orders?.length === 0 && (
        <TextBold textColor="text-midnight">No orders yet</TextBold>
      )}
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
        {stat == null && <TextBold textColor="text-midnight">⋯</TextBold>}
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
        <TextBold textColor="text-midnight">
          {
            timeAgo(order.time, undefined, now(), true) // TODO: get actual locale from context
          }
        </TextBold>
        ${Number(link.dollars).toFixed(2)}
      </div>
      <div className="w-16 text-right">
        <a className="text-primary" href={order.link} target="_blank">
          link
        </a>
      </div>
    </div>
  );
}
