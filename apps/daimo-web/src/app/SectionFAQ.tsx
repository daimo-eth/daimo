"use client";

import { useEffect, useState } from "react";

import readmeMD from "../../../../README.md";
import { Spacer } from "../components/layout";
import { FAQ, parseFAQs } from "../utils/parseFAQ";

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
  const [faq, setFaq] = useState([] as FAQ[]);
  useEffect(() => setFaq(parseFAQs(readmeMD)), []);

  return (
    <section className="bg-midnight-gradient pt-24" id="faq">
      <div className="mx-3 bg-white">
        <style dangerouslySetInnerHTML={{ __html: faqStyle }} />
        <div className="m-auto max-w-screen-xl px-8 section-faq">
          <h1 className="text-[32px] md:text-[50px] lg:text-[77px] tracking-tight">
            Frequently asked questions
          </h1>
          <Spacer h={48} />
          <ul>
            {faq.map((qna, i) => (
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
          className="text-[16px] md:text-[22px] text-[#777] leading-snug"
          dangerouslySetInnerHTML={{ __html: answerHtml }}
        />
        <Spacer h={16} />
      </details>
    </li>
  );
}
