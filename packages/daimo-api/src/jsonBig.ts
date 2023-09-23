export function jsonBigStringify(value: any) {
  return JSON.stringify(value, (_, v) => (typeof v === "bigint" ? `${v}n` : v));
}

export function jsonBigParse(text: string) {
  return JSON.parse(text, (_, value) => {
    if (typeof value === "string") {
      const m = value.match(/(-?\d+)n/);
      if (m && m[0] === value) {
        value = BigInt(m[1]);
      }
    }
    return value;
  });
}
