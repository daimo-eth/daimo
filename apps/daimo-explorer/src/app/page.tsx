"use client";

import { Header } from "../components/Header";
import { SearchBar } from "../components/SearchBar";
import { H1, H2, TextBody } from "../components/typography";

export default function Home() {
  return (
    <>
      <Header />
      <div className="h-4" />
      <main className="px-4">
        <H2>View activity on Ethereum</H2>
        <div className="h-2" />
        <TextBody>
          <strong>⚠️ Daimo Explorer is a work in progress.</strong> Today, we
          support 4337 userops and addresses on Ethereum mainnet and the Goerli
          testnet.
        </TextBody>
        <div className="h-4" />
        <SearchBar />
      </main>
    </>
  );
}
