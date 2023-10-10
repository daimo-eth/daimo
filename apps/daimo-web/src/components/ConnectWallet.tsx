"use client";
import { tokenMetadata } from "@daimo/contract";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseUnits } from "viem";
import { erc20ABI, useContractWrite, usePrepareContractWrite } from "wagmi";

import { H2 } from "./typography";

export function OrConnectWalletStub() {
  const amount = "0.01";
  const parsedAmount = parseUnits(amount, tokenMetadata.decimals);

  const { config, error } = usePrepareContractWrite({
    address: tokenMetadata.address,
    abi: erc20ABI,
    functionName: "transfer",
    args: ["0xF05b5f04B7a77Ca549C0dE06beaF257f40C66FDB", parsedAmount],
  });
  const { write } = useContractWrite(config);

  return (
    <center>
      <div className="h-2" />
      <H2>or</H2>
      <div className="h-2" />
      <button disabled={!write} onClick={() => write?.()}>
        Send
      </button>
      <div className="h-2" />
      <div className="flex justify-center">
        <ConnectButton />
      </div>
    </center>
  );
}
