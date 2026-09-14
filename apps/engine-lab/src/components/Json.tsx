export function Json({ value, maxLen = 4000 }: { value: unknown; maxLen?: number }) {
  let text: string;
  try {
    text = JSON.stringify(
      value,
      (_key, v) => (v instanceof Map ? Object.fromEntries(v) : v),
      2,
    ) ?? "undefined";
  } catch (e) {
    text = `<unable to serialize: ${e instanceof Error ? e.message : String(e)}>`;
  }
  const truncated = text.length > maxLen ? `${text.slice(0, maxLen)}\n… (${text.length - maxLen} more characters)` : text;
  return <pre className="tree">{truncated}</pre>;
}
