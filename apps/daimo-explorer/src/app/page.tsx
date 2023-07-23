"use client";

import { Header } from "../components/Header";
import { SearchBar } from "../components/SearchBar";
import { H1, TextBody } from "../components/typography";

export default function Home() {
  return (
    <>
      <Header />
      <div className="h-2" />
      <main className="px-4">
        <H1>See what&apos;s happening on Ethereum</H1>
        <div className="h-4" />
        <TextBody>
          <strong>⚠️ Daimo Explorer is a work in progress.</strong> Today, we
          support 4337 userops and addresses on Ethereum mainnet and the Goerli
          testnet.
        </TextBody>
        <div className="h-8" />
        <SearchBar />
      </main>
    </>
  );
}
