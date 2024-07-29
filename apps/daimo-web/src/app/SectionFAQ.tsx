"use client";

import { useState } from "react";

import { Spacer } from "../components/Spacer";
import { useI18N } from "../i18n/context";

const faqStyle = `
  details > summary {
    list-style: none;
  }
  details > summary::-webkit-details-marker {
    display: none;
  }
  details > summary::marker {
    display: none;
  }
  .section-faq p {
    margin-bottom: 16px;
  }
  .section-faq a {
    text-decoration: underline;
  }
`;

export function SectionFAQ() {
  const i18n = useI18N();
  const i18 = i18n.homePage.faq;

  return (
    <section className="bg-midnight-gradient pt-24" id="faq">
      <div className="mx-3 bg-white">
        <style dangerouslySetInnerHTML={{ __html: faqStyle }} />
        <div className="m-auto max-w-screen-xl px-8 section-faq">
          <h1 className="text-[32px] md:text-[50px] lg:text-[77px] tracking-tight">
            {i18.text1()}
          </h1>
          <Spacer h={48} />
          <ul>
            {i18.faqs().map((qna, i) => (
              <Question key={i} {...qna} />
            ))}
          </ul>
          <Spacer h={96} />
        </div>
      </div>
    </section>
  );
}

function Question({
  question,
  answerHtml,
}: {
  question: string;
  answerHtml: string;
}) {
  const [isOpen, setIsOpen] = useState(false); // Add this line to track open state
  const toggleOpen = () => setIsOpen(!isOpen); // This function toggles the open state

  return (
    <li className="border-b border-grayLight">
      <details className="group" onToggle={toggleOpen}>
        <summary className="text-[16px] md:text-[22px] text-[#323232] leading-none cursor-pointer py-8 flex justify-between items-center">
          {question}
          <span
            className={`text-[#14b174] transform transition-transform ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          >
            &darr;
          </span>
        </summary>
        <p
          style={{ whiteSpace: "pre-line" }}
          className="text-[16px] md:text-[22px] text-[#777] leading-snug"
          dangerouslySetInnerHTML={{ __html: answerHtml }}
        />
        <Spacer h={16} />
      </details>
    </li>
  );
}
