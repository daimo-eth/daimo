import { assert, getAccountName } from "@daimo/common";
import { Address, Hex, isHex } from "viem";

import { Header } from "../../../components/Header";
import { H1, H2, TextBody } from "../../../components/typography";
import { loadOpSummary } from "../../../lib/db";
import { E20Transfer, EOpSummary, zeroAddr } from "../../../lib/ethereumModel";
import { prettifyHex } from "../../../lib/utils";

type OpPageProps = {
  params: { slug?: string[] };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function OpPage(props: OpPageProps) {
  const opHash = props.params.slug![0] as Hex;
  assert(isHex(opHash));

  const opSummary = await loadOpSummary(opHash);

  return (
    <>
      <Header />
      <div className="h-4" />
      <main className="px-4">
        <H1>User Operation {prettifyHex(opHash)}</H1>
        <div className="h-2" />
        {opSummary ? (
          <OpBody o={opSummary} />
        ) : (
          <TextBody>{opHash} not found or indexed</TextBody>
        )}
      </main>
    </>
  );
}

function OpBody({ o }: { o: EOpSummary }) {
  // TODO: tags
  return (
    <div>
      {o.transfers.length > 0 && (
        <>
          <H2>Transfers</H2>
          <div className="h-4" />
          <div className="flex flex-col gap-2">
            {o.transfers.map((t, i) => (
              <TransferRow key={i} t={t} />
            ))}
          </div>
          <div className="h-4" />
        </>
      )}
      <H2>Details</H2>
      <div className="h-2" />
      <OpDataTable o={o} />
    </div>
  );
}

function TransferRow({ t }: { t: E20Transfer }) {
  return (
    <div className="rounded-md bg-gray-100 p-4">
      {t.from === zeroAddr && (
        <div>
          <strong>Minted</strong> by <AddrPellet a={t.to} />
        </div>
      )}
      {t.to === zeroAddr && (
        <div>
          <strong>Burned</strong> by <AddrPellet a={t.from} />
        </div>
      )}
      {t.from !== zeroAddr && t.to !== zeroAddr && (
        <div>
          <strong>Transfer</strong> from <AddrPellet a={t.from} /> to{" "}
          <AddrPellet a={t.to} />
        </div>
      )}
      <div>Amount {String(t.amount)}</div>
      <div>Token {t.token}</div>
    </div>
  );
}

function AddrPellet({ a }: { a: Address }) {
  // TODO: address, name, or ENS; copy button
  return <strong>{getAccountName({ addr: a })}</strong>;
}

function OpDataTable({ o }: { o: EOpSummary }) {
  return (
    <table className="table-auto">
      <tbody>
        <tr>
          <td className="font-bold">op_hash</td>
          <td>{prettifyHex(o.op.opHash!)}</td>
        </tr>
        <tr>
          <td className="font-bold">op_sender</td>
          <td>{prettifyHex(o.op.opSender!)}</td>
        </tr>
        <tr>
          <td className="font-bold">op_paymaster</td>
          <td>{prettifyHex(o.op.opPaymaster!)}</td>
        </tr>
        <tr>
          <td className="font-bold">op_success</td>
          <td>{JSON.stringify(o.op.opSuccess)}</td>
        </tr>
        <tr>
          <td className="font-bold">op_actual_gas_cost</td>
          <td>{o.op.opActualGasCost}</td>
        </tr>
        <tr>
          <td className="font-bold">op_actual_gas_used</td>
          <td>{o.op.opActualGasUsed}</td>
        </tr>
        <tr>
          <td className="font-bold">chain_id</td>
          <td>{o.op.chainID}</td>
        </tr>
        <tr>
          <td className="font-bold">block_hash</td>
          <td>{prettifyHex(o.op.blockHash!)}</td>
        </tr>
        <tr>
          <td className="font-bold">block_number</td>
          <td>{o.op.blockNumber}</td>
        </tr>
        <tr>
          <td className="font-bold">transaction_hash</td>
          <td>{prettifyHex(o.op.txHash!)}</td>
        </tr>
      </tbody>
    </table>
  );
}
