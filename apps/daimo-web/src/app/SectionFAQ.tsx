import { marked } from "marked";

import readmeMD from "../../../../README.md";
import { Spacer } from "../components/layout";
import { SectionH3 } from "../components/typography";

export function SectionFAQ() {
  const faq = parseFAQ(readmeMD);

  return (
    <section className="bg-ivory py-24">
      <div className="m-auto max-w-screen-xl">
        <SectionH3>Frequently Asked Questions</SectionH3>
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
  // const [expanded, setExpanded] = useState(false);
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

function parseFAQ(markdown: string) {
  function assert(cond: boolean, msg: string): asserts cond {
    if (!cond) throw new Error(`README FAQ: ${msg}`);
  }

  // Parse the FAQ from README
  const md = marked.lexer(readmeMD);
  const faqIx = md.findIndex(
    (token) => token.type === "heading" && token.text === "FAQ"
  );
  assert(faqIx >= 0, "missing");

  const faqList = md[faqIx + 1];
  assert(faqList.type === "list", "after ## FAQ should be a list");

  console.log(faqList.items[0]);

  const ret = [];
  for (const item of faqList.items) {
    assert(item.type === "list_item", "not a list item");
    const { tokens } = item;
    assert(tokens[0].type === "html", tokens[0].raw);
    const headerText = tokens[0].text;
    assert(headerText.startsWith("<details><summary>"), headerText);
    assert(headerText.endsWith("</summary>\n\n"), headerText);
    const question = headerText.slice(
      "<details><summary>".length,
      -"</summary>\n\n".length
    );

    assert(tokens.slice(-1)[0].type === "html", tokens.slice(-1)[0].raw);

    const answerTokens = tokens.slice(1, -1);
    const answerHtml = marked.parser(answerTokens);

    ret.push({ question, answerHtml });
  }

  return ret;
}
