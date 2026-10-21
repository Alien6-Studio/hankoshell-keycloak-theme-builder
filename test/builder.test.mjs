import test from "node:test";
import assert from "node:assert/strict";
import { buildTheme } from "../dist/builder.js";

test("the server compiler rejects hostile input before starting a build", async () => {
  await assert.rejects(buildTheme({ version: 1, name: "../escape" }));
  await assert.rejects(buildTheme({ version: 1, name: "example" }, { jarName: "../escape.jar" }));
});
test("an already cancelled job does not start a compiler or install tools", async () => {
  await assert.rejects(buildTheme({ version: 1, name: "example" }, { signal: AbortSignal.abort() }), { name: "AbortError" });
});
