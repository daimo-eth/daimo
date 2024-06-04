import { marked } from "marked";

export interface FAQ {
  question: string;
  answerHtml: string;
}

export function parseFAQs(markdown: string): FAQ[] {
  console.log(`[WEB] parsing FAQ, input README.md ${markdown.length} chars`);

  function assert(cond: boolean, msg: string): asserts cond {
    if (!cond) throw new Error(`README FAQ: ${msg}`);
  }

  // Parse the FAQ from README
  const md = marked.lexer(markdown);
  const faqIx = md.findIndex(
    (token) => token.type === "heading" && token.text === "FAQ"
  );
  assert(faqIx >= 0, "missing");

  const faqList = md[faqIx + 1];
  assert(faqList.type === "list", "after ## FAQ should be a list");

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
