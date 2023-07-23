import { assert } from "@daimo/common";
import { erc4337_userops, erc4337_useropsPayload } from "@prisma/client";
import { Hex, hexToBytes, isHex, toHex } from "viem";

import { Header } from "../../../components/Header";
import { H1, H2, TextBody } from "../../../components/typography";
import { prisma } from "../../../lib/prisma";
import { prettifyHex } from "../../../lib/utils";

type OpPageProps = {
  params: { slug?: string[] };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function OpPage(props: OpPageProps) {
  const opHash = props.params.slug![0] as Hex;
  assert(isHex(opHash));

  const opData = await prisma.erc4337_userops.findFirst({
    where: {
      op_hash: Buffer.from(hexToBytes(opHash)),
    },
  });

  return (
    <>
      <Header />
      <div className="h-4" />
      <main className="px-4">
        <H1>User Operation {prettifyHex(opHash)}</H1>
        <div className="h-2" />
        {opData ? (
          <OpDataTable opData={opData} />
        ) : (
          <TextBody>{opHash} not found or indexed</TextBody>
        )}
      </main>
    </>
  );
}

function OpDataTable({ opData }: { opData: erc4337_userops }) {
  return (
    <table className="table-auto">
      <tbody>
        <tr>
          <td className="font-bold">op_hash</td>
          <td>{prettifyHex(toHex(opData.op_hash as Uint8Array))}</td>
        </tr>
        <tr>
          <td className="font-bold">op_sender</td>
          <td>{prettifyHex(toHex(opData.op_sender as Uint8Array))}</td>
        </tr>
        <tr>
          <td className="font-bold">op_paymaster</td>
          <td>{prettifyHex(toHex(opData.op_paymaster as Uint8Array))}</td>
        </tr>
        <tr>
          <td className="font-bold">op_success</td>
          <td>{opData.op_success ? "TRUE" : "FALSE"}</td>
        </tr>
        <tr>
          <td className="font-bold">op_actual_gas_cost</td>
          <td>{opData.op_actual_gas_cost?.toNumber()}</td>
        </tr>
        <tr>
          <td className="font-bold">op_actual_gas_used</td>
          <td>{opData.op_actual_gas_used?.toNumber()}</td>
        </tr>
        <tr>
          <td className="font-bold">chain_id</td>
          <td>{opData.chain_id?.toNumber()}</td>
        </tr>
        <tr>
          <td className="font-bold">block_hash</td>
          <td>{prettifyHex(toHex(opData.block_hash as Uint8Array))}</td>
        </tr>
        <tr>
          <td className="font-bold">block_number</td>
          <td>{opData.block_number?.toNumber()}</td>
        </tr>
        <tr>
          <td className="font-bold">transaction_hash</td>
          <td>{prettifyHex(toHex(opData.transaction_hash as Uint8Array))}</td>
        </tr>
      </tbody>
    </table>
  );
}
