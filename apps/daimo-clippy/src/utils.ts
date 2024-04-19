export function parseKwargs(args: string[]): Map<string, string> {
  const kwargs: Map<string, string> = new Map();
  for (const arg of args) {
    let [key, value] = arg.split("=");
    if (key.startsWith("--")) key = key.slice(2);
    kwargs.set(key, value);
  }
  return kwargs;
}

// Convert slack's `<${link}|${link}>` to into just `${link}`
export function unfurlLink(link: string): string {
  const linkParts = link.split("|");
  const url = linkParts[0];
  return url.replace("<", "").replace(">", "");
}

export function getJSONblock(block: any): string {
  return `\`\`\`\n${JSON.stringify(block, null, 2)}\n\`\`\``;
}
