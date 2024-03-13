"use client";
import Image from "next/image";
import React from "react";

import { PrimaryButton } from "../../../components/buttons";
import { downloadMetadata } from "../../../utils/platform";

export default function DownloadPage() {
  return (
    <main className="max-w-2xl mx-auto px-4">
      <center>
        <div className="h-16" />
        <Image src="/logo-web-dark.png" alt="Daimo" width="96" height="96" />
        <div className="h-12" />

        <div className="text-2xl font-semibold">Download Daimo</div>
        <div className="h-8" />

        <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-8">
          <div className="flex flex-col w-5/12">
            <div className="h-[350px] flex flex-row items-center justify-center">
              <Image
                src="/assets/download/phones.png"
                width={240}
                height={345}
                alt="Android or iOS"
              />
            </div>
            <div className="h-8" />
            <PrimaryButton
              onClick={() => {
                window.open(downloadMetadata.ios.url, "_blank");
              }}
            >
              IPHONE OR IPAD
            </PrimaryButton>
            <div className="h-4" />
            <PrimaryButton
              onClick={() => {
                window.open(downloadMetadata.android.url, "_blank");
              }}
            >
              ANDROID
            </PrimaryButton>
            <div className="h-4" />
            <p className="text-xl font-semibold text-grayMid">
              Or visit{" "}
              <a href="https://daimo.com/download" className="text-royalblue">
                daimo.com/download
              </a>{" "}
              on your phone
            </p>
          </div>
          <div className="flex flex-row w-1/6 justify-center">
            <div className="h-[350px] flex flex-row items-center justify-center">
              <p className="text-xl font-semibold text-grayMid">OR</p>
            </div>
          </div>
          <div className="flex flex-col w-5/12">
            <div className="h-[350px] flex flex-row items-center justify-center">
              <Image
                src="/assets/download/mac.png"
                width={240}
                height={144}
                alt="MacOS"
              />
            </div>
            <div className="h-8" />
            <PrimaryButton
              onClick={() => {
                window.open(downloadMetadata.mac.url, "_blank");
              }}
            >
              MAC
            </PrimaryButton>
          </div>
        </div>
      </center>
    </main>
  );
}
