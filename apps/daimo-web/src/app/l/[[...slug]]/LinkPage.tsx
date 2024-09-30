"use client";

import Image from "next/image";

import { CallToAction } from "../../../components/CallToAction";
import { Providers } from "../../../components/Providers";
import { I18NProvider, useI18N } from "../../../i18n/context";
import { LinkStatusDesc } from "../../../utils/linkStatus";

export default function LinkPage({
  lang,
  statusDesc,
  pfp,
}: {
  lang: string | null;
  statusDesc: LinkStatusDesc | null;
  pfp: string | undefined;
}) {
  return (
    <Providers>
      <I18NProvider lang={lang}>
        <LinkPageInner {...{ statusDesc, pfp }} />
      </I18NProvider>
    </Providers>
  );
}

function LinkPageInner({
  statusDesc,
  pfp,
}: {
  statusDesc: LinkStatusDesc | null;
  pfp: string | undefined;
}) {
  const i18n = useI18N();

  const { name, action, dollars, description, linkStatus, memo } =
    statusDesc || {
      description: i18n.meta.description(),
    };

  return (
    <main className="max-w-md mx-auto px-4">
      <center>
        <div className="h-16" />
        <Image src="/logo-web.png" alt="Daimo" width="96" height="96" />

        <div className="h-12" />

        <div className="flex text-xl font-semibold justify-center items-center">
          <div className="flex flex-row gap-x-2">
            {pfp && (
              <div
                className="flex h-[32px] w-[32px]"
                style={{ position: "relative" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pfp}
                  alt={"Profile"}
                  width={32}
                  height={32}
                  style={{
                    objectFit: "cover",
                    borderRadius: "100px",
                    width: "32px",
                    height: "32px",
                  }}
                />
              </div>
            )}

            <div className="flex items-center gap-x-1">
              {name && <span>{name}</span>}
              {action && <span className="text-grayMid">{" " + action}</span>}
            </div>
          </div>
        </div>
        {dollars && (
          <>
            <div className="h-4" />
            <div className="text-6xl font-semibold">${dollars}</div>
          </>
        )}
        {memo && (
          <>
            <div className="h-4" />
            <p className="text-xl italic font-semibold text-grayMid">{memo}</p>
          </>
        )}
        <div className="h-9" />
        <CallToAction {...{ description, linkStatus }} />
      </center>
    </main>
  );
}
