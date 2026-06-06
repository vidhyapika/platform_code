import assert from "node:assert/strict";
import { prepareSpokenText } from "./prepareSpokenText.js";

function test(name: string, input: string, expectedIncludes: string[], expectedExcludes: string[] = []) {
  const out = prepareSpokenText(input);
  for (const part of expectedIncludes) {
    assert.ok(out.toLowerCase().includes(part.toLowerCase()), `${name}: expected "${part}" in "${out}"`);
  }
  for (const part of expectedExcludes) {
    assert.ok(!out.includes(part), `${name}: should not include "${part}" in "${out}"`);
  }
}

test("verbalizes inline math", "The answer is $x^2$.", ["x squared"], ["$", "^"]);
test("verbalizes fraction", "Use $\\frac{a}{b}$ here.", ["a over b"], ["\\frac", "$"]);
test("strips markdown bold", "This is **important**.", ["important"], ["**"]);
test("strips html", "<p>Hello <strong>world</strong></p>", ["Hello", "world"], ["<", ">"]);
test("strips orphan dollars", "Cost is $5 and $x$.", ["5"], ["$"]);

console.log("prepareSpokenText tests passed");
