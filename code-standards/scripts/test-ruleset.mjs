// Checks code-standards/ruleset.xml against the fixtures in code-standards/fixtures.
// Layout: fixtures/<group>/<RuleName>/bad/* must report <RuleName>; fixtures/<group>/<RuleName>/good/* must not.
// Groups: apex (.cls) and metadata (.xml). The new-files fixtures are tested by check-new-files.test.mjs.
// Usage: PMD_BIN=/path/to/pmd node code-standards/scripts/test-ruleset.mjs (defaults to `pmd` on the PATH).
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const ruleset = resolve(root, "code-standards/ruleset.xml");
const fixturesDir = resolve(root, "code-standards/fixtures");
const GROUPS = ["apex", "metadata"];
const pmd = process.env.PMD_BIN ?? "pmd";

// PMD exits with 0 when there are no violations and 4 when there are; anything else is a failure.
const PMD_OK_EXIT_CODES = [0, 4];

const result = spawnSync(
  pmd,
  [
    "check",
    "--dir",
    GROUPS.map((group) => join(fixturesDir, group)).join(","),
    "--rulesets",
    ruleset,
    "--format",
    "json",
    "--no-cache",
    "--no-progress"
  ],
  { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
);

if (result.error) {
  console.error(
    `Could not run PMD (${pmd}): ${result.error.message}. Set PMD_BIN to the PMD launcher.`
  );
  process.exit(2);
}

if (!PMD_OK_EXIT_CODES.includes(result.status)) {
  console.error(result.stderr);
  process.exit(2);
}

const report = JSON.parse(result.stdout);
const problems = [
  ...(report.processingErrors ?? []),
  ...(report.configurationErrors ?? [])
];

if (problems.length > 0) {
  console.error("PMD reported processing or configuration errors:");
  console.error(JSON.stringify(problems, null, 2));
  process.exit(2);
}

const rulesByFile = new Map(
  report.files.map((file) => [
    resolve(root, file.filename),
    new Set(file.violations.map((violation) => violation.rule))
  ])
);

const listDirs = (dir) =>
  readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

const listFixtures = (dir) => {
  try {
    return readdirSync(dir).filter(
      (name) => name.endsWith(".cls") || name.endsWith(".xml")
    );
  } catch {
    return [];
  }
};

let failures = 0;
let checks = 0;

const ruleDirs = GROUPS.flatMap((group) =>
  listDirs(join(fixturesDir, group)).map((rule) => ({
    rule,
    dir: join(fixturesDir, group, rule)
  }))
);

for (const { rule, dir } of ruleDirs) {
  for (const kind of ["bad", "good"]) {
    const kindDir = join(dir, kind);

    for (const name of listFixtures(kindDir)) {
      const file = join(kindDir, name);
      const reported = rulesByFile.get(file)?.has(rule) ?? false;
      const passed = kind === "bad" ? reported : !reported;

      checks++;
      if (!passed) {
        failures++;
      }

      const expectation = kind === "bad" ? "reports" : "does not report";
      console.log(
        `${passed ? "PASS" : "FAIL"}  ${relative(root, file)} ${expectation} ${rule}`
      );
    }
  }
}

console.log(`\n${checks - failures}/${checks} fixture checks passed.`);
process.exit(failures > 0 ? 1 : 0);
