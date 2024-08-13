"use client";
import Image from "next/image";
import React, { useState } from "react";

import { PrimaryButton } from "../../components/buttons";
import { useI18N } from "../../i18n/context";
import { rpc } from "../../utils/rpc";

export default function WaitlistPage() {
  const i18n = useI18N();
  const i18 = i18n.waitlist;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [socials, setSocials] = useState("");
  const [submitState, setSubmitState] = useState<
    "idle" | "loading" | "submitted"
  >("idle");

  const onSubmit = async () => {
    console.log("submit", name, email, socials);
    setSubmitState("loading");
    await rpc.submitWaitlist.mutate({ name, email, socials });
    setSubmitState("submitted");
  };

  return (
    <main className="max-w-2xl mx-auto px-4">
      <center>
        <div className="h-8" />
        <Image src="/logo-web.png" alt="Daimo" width="96" height="96" />
        <div className="h-8" />

        <div className="text-2xl font-semibold">{i18.signUp()}</div>
        <div className="h-8" />

        <div className="text-md">{i18.isLimited()}</div>
        <div className="h-8" />

        <form className="flex flex-col gap-4 w-[8/10]" onSubmit={onSubmit}>
          <div className="flex flex-col gap-2 text-left font-semibold">
            <label htmlFor="name" className="text-grayMid">
              {i18.name()}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-2 border-primary rounded-md px-4 py-2"
            />
          </div>
          <div className="flex flex-col gap-2 text-left font-semibold">
            <label htmlFor="email" className="text-grayMid">
              {i18.email()}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-2 border-primary rounded-md px-4 py-2"
            />
          </div>
          <div className="flex flex-col gap-2 text-left font-semibold">
            <label htmlFor="socials" className="text-grayMid">
              {i18.social()}
            </label>
            <input
              id="socials"
              type="text"
              value={socials}
              onChange={(e) => setSocials(e.target.value)}
              className="border-2 border-primary rounded-md px-4 py-2"
            />
          </div>
          {submitState === "idle" && (
            <div className="flex flex-col gap-2 w-[8/10] py-8">
              <PrimaryButton onClick={onSubmit}>{i18.submit()}</PrimaryButton>
            </div>
          )}
          {submitState === "loading" && (
            <div className="flex flex-col gap-2 w-[8/10] py-8">
              <PrimaryButton disabled>{i18.submitting()}</PrimaryButton>
            </div>
          )}
          {submitState === "submitted" && (
            <div className="text-md">{i18.submitted()}</div>
          )}
        </form>
      </center>
    </main>
  );
}
