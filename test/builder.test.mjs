import test from "node:test";
import assert from "node:assert/strict";
import { buildTheme } from "../dist/builder.js";
import { htmlText, sourceLiteral } from "../dist/serialization.js";

test("generated modules retain text without HTML script terminators or line separators", () => {
  const text = "</script><img src=x onerror='example()'>\u2028\u2029\\\"";
  const literal = sourceLiteral({ headline: text });
  assert.equal(/[<>\u2028\u2029]/.test(literal), false);
  assert.equal(JSON.parse(literal).headline, text);
});

test("the server compiler rejects hostile input before starting a build", async () => {
  await assert.rejects(buildTheme({ version: 1, name: "../escape" }));
  await assert.rejects(buildTheme({ version: 1, name: "example" }, { jarName: "../escape.jar" }));
});
test("an already cancelled job does not start a compiler or install tools", async () => {
  await assert.rejects(buildTheme({ version: 1, name: "example" }, { signal: AbortSignal.abort() }), { name: "AbortError" });
});

test("the native document title cannot introduce HTML elements", () => {
  assert.equal(htmlText('Aurora & </title><script>'), 'Aurora &amp; &lt;/title&gt;&lt;script&gt;');
});
