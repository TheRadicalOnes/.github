// Tests for the change parsing and new/existing classification of check-pmd.mjs.
// Run with: node --test code-standards/scripts/check-pmd.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  classifyFindings,
  parseChangedLines,
  parseNameStatus,
  toFindings
} from "./check-pmd.mjs";

const finding = (
  file,
  line,
  rule,
  message = `${rule} message`,
  endLine = line
) => ({
  file,
  line,
  endLine,
  rule,
  severity: "error",
  message
});

const statuses = (findings) =>
  findings.map((item) => `${item.line}:${item.rule}:${item.status}`).sort();

test("parseNameStatus keeps added, modified and renamed files and skips deleted ones", () => {
  const output = [
    "A",
    "a/New.cls",
    "M",
    "a/Old.cls",
    "R087",
    "a/Before.cls",
    "a/After.cls",
    "D",
    "a/Gone.cls",
    ""
  ].join("\0");

  const changes = parseNameStatus(output);

  assert.deepEqual(
    [...changes.keys()],
    ["a/New.cls", "a/Old.cls", "a/After.cls"]
  );
  assert.equal(changes.get("a/New.cls").status, "A");
  assert.equal(changes.get("a/Old.cls").oldPath, "a/Old.cls");
  assert.equal(changes.get("a/After.cls").oldPath, "a/Before.cls");
});

test("parseChangedLines reads the added lines of each hunk", () => {
  const diff = [
    "diff --git a/a/Old.cls b/a/Old.cls",
    "--- a/a/Old.cls",
    "+++ b/a/Old.cls",
    "@@ -10,0 +11,2 @@ class",
    "+  one",
    "+  two",
    "@@ -20 +22 @@",
    "-  old",
    "+  new",
    "@@ -30,3 +33,0 @@",
    "-  removed"
  ].join("\n");

  assert.deepEqual([...parseChangedLines(diff).get("a/Old.cls")], [11, 12, 22]);
});

test("toFindings maps SARIF levels to severities", () => {
  const sarif = {
    runs: [
      {
        results: [
          {
            ruleId: "ApexDoc",
            level: "error",
            message: { text: "Missing ApexDoc comment" },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: { uri: "a/Old.cls" },
                  region: { startLine: 1, endLine: 9 }
                }
              }
            ]
          },
          {
            ruleId: "R1UseAssertClass",
            level: "warning",
            message: { text: "Use the Assert class" },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: { uri: "a/Old.cls" },
                  region: { startLine: 4 }
                }
              }
            ]
          }
        ]
      }
    ]
  };

  assert.deepEqual(toFindings(sarif, "/repo"), [
    {
      file: "a/Old.cls",
      line: 1,
      endLine: 9,
      rule: "ApexDoc",
      severity: "error",
      message: "Missing ApexDoc comment"
    },
    {
      file: "a/Old.cls",
      line: 4,
      endLine: 4,
      rule: "R1UseAssertClass",
      severity: "warning",
      message: "Use the Assert class"
    }
  ]);
});

test("every finding of an added file is new", () => {
  const result = classifyFindings({
    headFindings: [finding("a/New.cls", 1, "ApexDoc")],
    baseFindings: [],
    changes: new Map([["a/New.cls", { status: "A", path: "a/New.cls" }]]),
    changedLines: new Map()
  });

  assert.deepEqual(statuses(result), ["1:ApexDoc:new"]);
});

test("a finding that already existed in the base version is existing, even if its line moved", () => {
  const result = classifyFindings({
    headFindings: [finding("a/Old.cls", 243, "ApexCRUDViolation")],
    baseFindings: [finding("a/Old.cls", 242, "ApexCRUDViolation")],
    changes: new Map([
      ["a/Old.cls", { status: "M", path: "a/Old.cls", oldPath: "a/Old.cls" }]
    ]),
    changedLines: new Map([["a/Old.cls", new Set([10])]])
  });

  assert.deepEqual(statuses(result), ["243:ApexCRUDViolation:existing"]);
});

test("an extra occurrence of a rule is new, and the one on changed lines is chosen", () => {
  const result = classifyFindings({
    headFindings: [
      finding("a/Old.cls", 30, "ApexCRUDViolation"),
      finding("a/Old.cls", 80, "ApexCRUDViolation")
    ],
    baseFindings: [finding("a/Old.cls", 30, "ApexCRUDViolation")],
    changes: new Map([
      ["a/Old.cls", { status: "M", path: "a/Old.cls", oldPath: "a/Old.cls" }]
    ]),
    changedLines: new Map([["a/Old.cls", new Set([80])]])
  });

  assert.deepEqual(statuses(result), [
    "30:ApexCRUDViolation:existing",
    "80:ApexCRUDViolation:new"
  ]);
});

test("a metric that got worse is new because its message changed", () => {
  const result = classifyFindings({
    headFindings: [
      finding(
        "a/Old.cls",
        12,
        "CyclomaticComplexity",
        "method 'run' has a cyclomatic complexity of 13"
      )
    ],
    baseFindings: [
      finding(
        "a/Old.cls",
        12,
        "CyclomaticComplexity",
        "method 'run' has a cyclomatic complexity of 11"
      )
    ],
    changes: new Map([
      ["a/Old.cls", { status: "M", path: "a/Old.cls", oldPath: "a/Old.cls" }]
    ]),
    changedLines: new Map([["a/Old.cls", new Set([20])]])
  });

  assert.deepEqual(statuses(result), ["12:CyclomaticComplexity:new"]);
});

test("findings of a renamed file are compared with its old path", () => {
  const result = classifyFindings({
    headFindings: [finding("a/After.cls", 1, "ApexDoc")],
    baseFindings: [finding("a/Before.cls", 1, "ApexDoc")],
    changes: new Map([
      [
        "a/After.cls",
        { status: "M", path: "a/After.cls", oldPath: "a/Before.cls" }
      ]
    ]),
    changedLines: new Map()
  });

  assert.deepEqual(statuses(result), ["1:ApexDoc:existing"]);
});
