// Tests for the rule catalog links and the annotation text.
// Run with: node --test code-standards/scripts/rules.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";

import { describeFinding } from "./annotations.mjs";
import { CATEGORIES, RULES, ruleDocUrl } from "./rules.mjs";

test("every rule belongs to a known category and cites a section", () => {
  for (const [name, entry] of Object.entries(RULES)) {
    assert.ok(
      CATEGORIES.includes(entry.category),
      `${name} has an unknown category`
    );
    assert.ok(
      entry.checks && entry.section,
      `${name} needs checks and section`
    );
  }
});

test("ruleDocUrl links to the category heading at the given ref", () => {
  assert.equal(
    ruleDocUrl("OperationWithLimitsInLoop", "v1"),
    "https://github.com/TheRadicalOnes/.github/blob/v1/code-standards/README.md#queries-dml-and-asynchronous-apex"
  );
  assert.equal(ruleDocUrl("UnknownRule", "v1"), null);
});

test("describeFinding adds the section and the link to known rules only", () => {
  process.env.STANDARDS_REF = "v1";

  assert.equal(
    describeFinding({
      rule: "ApexCRUDViolation",
      message: "Enforce user mode."
    }),
    "Enforce user mode.\nConventions: III Rule 3 · Rule reference: https://github.com/TheRadicalOnes/.github/blob/v1/code-standards/README.md#security"
  );
  assert.equal(
    describeFinding({ rule: "UnknownRule", message: "Something." }),
    "Something."
  );
});
