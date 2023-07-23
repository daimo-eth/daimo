import { assert } from "@daimo/common";
import { erc4337_userops } from "@prisma/client";
import { Hex, hexToBytes, isAddress, toHex } from "viem";

import { Header } from "../../../components/Header";
import { H1 } from "../../../components/typography";
import { prisma } from "../../../lib/prisma";
import { prettifyHex } from "../../../lib/utils";

type AddrPageProps = {
  params: { slug?: string[] };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function AddrPage(props: AddrPageProps) {
  const addr = props.params.slug![0] as Hex;
  assert(isAddress(addr));

  const paymasterTxes = await prisma.erc4337_userops.findMany({
    where: {
      op_paymaster: Buffer.from(hexToBytes(addr)),
    },
  });

  const senderTxes = await prisma.erc4337_userops.findMany({
    where: {
      op_sender: Buffer.from(hexToBytes(addr)),
    },
  });

  const addrType = paymasterTxes.length > 0 ? "Paymaster" : "Sender";

  return (
    <>
      <Header />
      <div className="h-4" />
      <main className="px-4">
        <H1>
          {addrType} {prettifyHex(addr)}
        </H1>
        <div className="h-2" />
        {addrType === "Paymaster" ? (
          <TransactionList txes={paymasterTxes} />
        ) : (
          <TransactionList txes={senderTxes} />
        )}
      </main>
    </>
  );
}

function TransactionList({ txes }: { txes: erc4337_userops[] }) {
  // sort by block_number desc
  txes = txes.sort((a, b) => {
    return b.block_number!.toNumber() - a.block_number!.toNumber();
  });

  return (
    <table className="table-auto">
      <thead>
        <tr>
          <th className="font-bold">op_hash</th>
          <th className="font-bold">block_number</th>
          <th className="font-bold">op_success</th>
        </tr>
      </thead>
      <tbody>
        {txes.map((tx) => (
          <tr key={tx.op_hash!.toString()}>
            <td>{prettifyHex(toHex(tx.op_hash as Uint8Array))}</td>
            <td>{tx.block_number?.toNumber()}</td>
            <td>{tx.op_success ? "TRUE" : "FALSE"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
