// Generates the "Rule reference" section of code-standards/README.md from ruleset.xml and check-new-files.mjs,
// so the table always matches the real rules and severities.
// Usage: node code-standards/scripts/rule-reference.mjs --write   (updates the README)
//        node code-standards/scripts/rule-reference.mjs --check   (exits with 1 when the README is out of date)
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { CATEGORIES, RULES } from "./rules.mjs";

const dir = fileURLToPath(new URL("../", import.meta.url));
const RULESET = `${dir}ruleset.xml`;
const NEW_FILES_SCRIPT = `${dir}scripts/check-new-files.mjs`;
const README = `${dir}README.md`;
const START = "<!-- rule-reference:start -->";
const END = "<!-- rule-reference:end -->";

const SEVERITY = { 1: "Error", 3: "Warning" };

const attribute = (tag, name) =>
  new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];

const property = (block, name) =>
  new RegExp(`<property\\s+name="${name}"\\s+value="([^"]*)"`).exec(block)?.[1];

// Report levels are inclusive; very high values only disable one side of a rule.
const level = (value) =>
  value && Number(value) !== 999 && Number(value) < 99999
    ? Number(value)
    : null;

const threshold = (name, block) => {
  const method = level(property(block, "methodReportLevel"));
  const type = level(property(block, "classReportLevel"));
  const minimum = level(property(block, "minimum"));
  const maxFields = level(property(block, "maxfields"));
  const depth = level(property(block, "problemDepth"));
  const count = /count\([\s\S]*?\)\s*(>=|>)\s*(\d+)/.exec(block);

  if (name.startsWith("NcssCountTestClass")) {
    return `≥${type} lines per test class`;
  }
  if (method || type) {
    const unit = name.startsWith("NcssCount") ? " lines" : "";
    return [
      method && `≥${method}${unit} per method`,
      type && `≥${type}${unit} per class`
    ]
      .filter(Boolean)
      .join(", ");
  }
  if (minimum) {
    return `≥${minimum} parameters`;
  }
  if (maxFields) {
    return `≥${maxFields + 1} fields`;
  }
  if (depth) {
    return `${depth} or more levels`;
  }
  if (count) {
    const value = count[1] === ">" ? Number(count[2]) + 1 : Number(count[2]);
    return `≥${value} ${name.startsWith("R1Flow") ? "elements" : "methods"}`;
  }
  return "";
};

const readRulesetRules = () =>
  [
    ...readFileSync(RULESET, "utf8").matchAll(
      /<rule\b([^>]*)>([\s\S]*?)<\/rule>/g
    )
  ].map(([, tag, block]) => {
    const name =
      attribute(tag, "name") ?? attribute(tag, "ref").split("/").pop();
    const priority = /<priority>(\d)<\/priority>/.exec(block)?.[1];
    return {
      name,
      severity: SEVERITY[priority],
      threshold: threshold(name, block)
    };
  });

const readNewFilesRules = () => {
  const source = readFileSync(NEW_FILES_SCRIPT, "utf8");
  const names = new Map();
  for (const [, kind, name] of source.matchAll(
    /\b(error|warning)\(\s*file,\s*"(R1\w+)"/g
  )) {
    names.set(name, kind === "warning" ? "Warning" : "Error");
  }
  for (const [, name] of source.matchAll(/rule: "(R1\w+)"/g)) {
    names.set(name, names.get(name) ?? "Error");
  }
  return [...names].map(([name, severity]) => ({
    name,
    severity,
    threshold: ""
  }));
};

const escapeCell = (value) => value.replace(/\|/g, "\\|");

export const buildReference = () => {
  const rules = [...readRulesetRules(), ...readNewFilesRules()];
  const missing = rules
    .filter((rule) => !RULES[rule.name] || !rule.severity)
    .map((rule) => rule.name);
  if (missing.length > 0) {
    throw new Error(
      `Add an entry to RULES in rules.mjs for: ${missing.join(", ")}`
    );
  }

  const lines = [
    START,
    "",
    "_Generated from `ruleset.xml` and `scripts/check-new-files.mjs` by `npm run standards:rules`. Do not edit by hand._",
    ""
  ];
  const counts = { Error: 0, Warning: 0 };

  for (const category of CATEGORIES) {
    const inCategory = rules.filter(
      (rule) => RULES[rule.name].category === category
    );
    if (inCategory.length === 0) {
      continue;
    }
    lines.push(
      `#### ${category}`,
      "",
      "| Rule | Checks | Threshold | Severity | Conventions |",
      "| --- | --- | --- | --- | --- |"
    );
    for (const rule of inCategory) {
      counts[rule.severity]++;
      lines.push(
        `| \`${rule.name}\` | ${escapeCell(RULES[rule.name].checks)} | ${rule.threshold || "—"} | ${rule.severity} | ${RULES[rule.name].section} |`
      );
    }
    lines.push("");
  }

  lines.splice(
    4,
    0,
    `**${rules.length} rules:** ${counts.Error} errors and ${counts.Warning} warnings. Rules ending in \`Target\` are the warning copies of a limit.`,
    ""
  );
  lines.push(END);
  return lines.join("\n");
};

// Prettier realigns the tables, so the comparison ignores spacing and the length of separator rows.
const normalize = (text) =>
  text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").replace(/-{3,}/g, "---").trim())
    .filter(Boolean)
    .join("\n");

const main = () => {
  const mode = process.argv[2];
  const readme = readFileSync(README, "utf8");
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);
  if (start < 0 || end < 0) {
    throw new Error(`README.md needs the ${START} and ${END} markers.`);
  }

  const current = readme.slice(start, end + END.length);
  const generated = buildReference();

  if (mode === "--write") {
    writeFileSync(
      README,
      readme.slice(0, start) + generated + readme.slice(end + END.length)
    );
    console.log("Rule reference updated.");
  } else if (mode === "--check") {
    if (normalize(current) !== normalize(generated)) {
      console.error(
        "The rule reference in code-standards/README.md is out of date. Run: npm run standards:rules"
      );
      process.exitCode = 1;
      return;
    }
    console.log("Rule reference is up to date.");
  } else {
    throw new Error("Pass --write or --check.");
  }
};

try {
  main();
} catch (failure) {
  console.error(failure.message);
  process.exitCode = 2;
}
