/** A JavaScript literal that also stays inert if a bundler embeds it in HTML. */
export function sourceLiteral(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new Error("Cannot serialize an undefined source literal");
  return serialized.replace(/[<>\u2028\u2029]/g, character => ({ "<": "\\u003c", ">": "\\u003e", "\u2028": "\\u2028", "\u2029": "\\u2029" })[character]!);
}

/** Escape text placed in an HTML title before React starts. */
export function htmlText(value: string): string {
  return value.replace(/[&<>"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]!);
}
