"use client";

import { Spacer } from "../components/layout";
import { TextH1 } from "../components/typography";
import { FAQ } from "../utils/parseFAQ";

export function SectionFAQ({ faq }: { faq: FAQ[] }) {
  return (
    <section className="bg-ivory py-24" id="faq">
      <style>{`
        .section-faq p {
          margin-bottom: 16px;
        }
        .section-faq a {
          text-decoration: underline;
        }
      `}</style>
      <div className="m-auto max-w-screen-xl px-8 section-faq">
        <TextH1>Frequently Asked Questions</TextH1>
        <Spacer h={48} />
        <ul className="border-t border-grayLight">
          {faq.map((qna, i) => (
            <Question key={i} {...qna} />
          ))}
        </ul>
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
  return (
    <li className="border-b border-grayLight">
      <details>
        <summary className="text-2xl text-midnight leading-none cursor-pointer py-8">
          {question}
        </summary>
        <p
          className="text-2xl text-grayMid leading-snug pl-5"
          dangerouslySetInnerHTML={{ __html: answerHtml }}
        />
        <Spacer h={16} />
      </details>
    </li>
  );
}
