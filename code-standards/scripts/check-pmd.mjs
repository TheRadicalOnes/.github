// Runs PMD with code-standards/ruleset.xml on the files a change adds or modifies, and tells new findings from
// pre-existing ones: modified files are also analyzed in their base version, and a finding only counts as new
// when the change introduces it or makes it worse. Line numbers are not compared, so moved code is not reported.
//
// Usage (from the repository to check, or with --root):
//   node code-standards/scripts/check-pmd.mjs --base <ref> [--head <ref>] [--output findings.json]
//   node code-standards/scripts/check-pmd.mjs [--output findings.json]   (no base: every finding is new)
// Options: --root <dir> (repository to check, default: current directory), --source <dir> (default force-app),
// --ruleset <file> (default: the ruleset.xml next to this folder).
// PMD is taken from PMD_BIN, or `pmd` on the PATH. Prints annotations for new findings only.
// Exits with 0 when the analysis ran (the summary decides whether findings fail the job) and 2 when it failed.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { printFindings } from "./annotations.mjs";

// The ruleset has Apex and XML (Flow, Validation Rule, field) rules only.
const ANALYZED_EXTENSIONS = [".cls", ".trigger", ".xml"];

const toPosix = (path) => path.split(sep).join("/");

/**
 * Parses `git diff --name-status -z -M` output into changes keyed by the new path.
 * Added and copied files have no base version; renamed files keep their old path.
 */
export const parseNameStatus = (output) => {
  const tokens = output.split("\0").filter(Boolean);
  const changes = new Map();

  for (let i = 0; i < tokens.length;) {
    const status = tokens[i++];
    const kind = status[0];

    if (kind === "R" || kind === "C") {
      const oldPath = tokens[i++];
      const path = tokens[i++];
      changes.set(
        path,
        kind === "R" ? { status: "M", path, oldPath } : { status: "A", path }
      );
    } else if (kind === "A" || kind === "M") {
      const path = tokens[i++];
      changes.set(path, {
        status: kind,
        path,
        oldPath: kind === "M" ? path : undefined
      });
    } else {
      i++;
    }
  }

  return changes;
};

/**
 * Parses `git diff -U0` output into the added or changed line numbers of each new file path.
 */
export const parseChangedLines = (diff) => {
  const linesByFile = new Map();
  let current = null;

  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ ")) {
      const path = line.slice(4).replace(/^b\//, "");
      current = path === "/dev/null" ? null : path;
      if (current && !linesByFile.has(current)) {
        linesByFile.set(current, new Set());
      }
      continue;
    }

    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (hunk && current) {
      const start = Number(hunk[1]);
      const count = hunk[2] === undefined ? 1 : Number(hunk[2]);
      for (let lineNumber = start; lineNumber < start + count; lineNumber++) {
        linesByFile.get(current).add(lineNumber);
      }
    }
  }

  return linesByFile;
};

/**
 * Converts a PMD SARIF report to findings with repository-relative paths.
 * @param {object} sarif The SARIF report.
 * @param {string} root Directory the analyzed paths are relative to.
 */
export const toFindings = (sarif, root) =>
  (sarif?.runs ?? []).flatMap((run) =>
    (run.results ?? []).map((result) => {
      const location = result.locations?.[0]?.physicalLocation;
      const uri = location?.artifactLocation?.uri ?? "";
      const path = uri.startsWith("file:")
        ? relative(root, fileURLToPath(uri))
        : uri;
      const line = location?.region?.startLine ?? 1;

      return {
        file: toPosix(path),
        line,
        endLine: location?.region?.endLine ?? line,
        rule: result.ruleId,
        severity: result.level === "error" ? "error" : "warning",
        message: result.message?.text ?? ""
      };
    })
  );

const findingKey = (finding) => `${finding.rule}\u0000${finding.message}`;

const touchesChangedLines = (finding, changedLines) => {
  for (let line = finding.line; line <= finding.endLine; line++) {
    if (changedLines.has(line)) {
      return true;
    }
  }
  return false;
};

/**
 * Marks each head finding as "new" or "existing".
 * Findings are matched by rule and message (which includes values such as the complexity), not by line, so code
 * that only moved is not reported. When a file has more matching findings than its base version, the ones on
 * changed lines are the new ones.
 * @param {object} options
 * @param {object[]} options.headFindings Findings of the changed files.
 * @param {object[]} options.baseFindings Findings of the base version of the modified files, keyed by old path.
 * @param {Map} options.changes Changes by new path, from parseNameStatus.
 * @param {Map} options.changedLines Changed lines by new path, from parseChangedLines.
 */
export const classifyFindings = ({
  headFindings,
  baseFindings,
  changes,
  changedLines
}) => {
  const baseCounts = new Map();
  for (const finding of baseFindings) {
    const key = `${finding.file}\u0000${findingKey(finding)}`;
    baseCounts.set(key, (baseCounts.get(key) ?? 0) + 1);
  }

  const groups = new Map();
  for (const finding of headFindings) {
    const key = `${finding.file}\u0000${findingKey(finding)}`;
    groups.set(key, [...(groups.get(key) ?? []), finding]);
  }

  return [...groups.values()].flatMap((group) => {
    const file = group[0].file;
    const change = changes.get(file);

    if (!change || change.status === "A") {
      return group.map((finding) => ({ ...finding, status: "new" }));
    }

    const lines = changedLines.get(file) ?? new Set();
    const existingCount =
      baseCounts.get(`${change.oldPath}\u0000${findingKey(group[0])}`) ?? 0;
    const ordered = [...group].sort(
      (a, b) =>
        Number(touchesChangedLines(a, lines)) -
          Number(touchesChangedLines(b, lines)) || a.line - b.line
    );

    return ordered.map((finding, index) => ({
      ...finding,
      status: index < existingCount ? "existing" : "new"
    }));
  });
};

const git = (root, args) =>
  execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024
  });

const runPmd = ({ pmd, ruleset, files, root, workDir, name }) => {
  const fileList = join(workDir, `${name}-files.txt`);
  const report = join(workDir, `${name}.sarif`);
  writeFileSync(fileList, files.map((file) => resolve(root, file)).join("\n"));

  const result = spawnSync(
    pmd,
    [
      "check",
      "--file-list",
      fileList,
      "--rulesets",
      ruleset,
      "--format",
      "sarif",
      "--report-file",
      report,
      "--relativize-paths-with",
      root,
      "--no-cache",
      "--no-progress",
      "--no-fail-on-violation"
    ],
    { encoding: "utf8" }
  );

  if (result.error) {
    throw new Error(
      `Could not run PMD (${pmd}): ${result.error.message}. Set PMD_BIN to the PMD launcher.`
    );
  }
  if (result.status !== 0) {
    throw new Error(
      `PMD failed with exit code ${result.status}:\n${result.stderr}`
    );
  }

  return JSON.parse(readFileSync(report, "utf8"));
};

const parseArgs = (args) => {
  const options = {
    root: process.cwd(),
    source: "force-app",
    ruleset: fileURLToPath(new URL("../ruleset.xml", import.meta.url))
  };
  for (let i = 0; i < args.length; i += 2) {
    if (
      ![
        "--base",
        "--head",
        "--output",
        "--root",
        "--source",
        "--ruleset"
      ].includes(args[i])
    ) {
      throw new Error(`Unknown argument: ${args[i]}`);
    }
    options[args[i].slice(2)] = args[i + 1];
  }
  return options;
};

const isAnalyzed = (path) =>
  ANALYZED_EXTENSIONS.some((extension) => path.endsWith(extension));

const analyzeChange = ({ root, options, pmd, workDir }) => {
  const head = options.head ?? "HEAD";
  const range = `${options.base}...${head}`;
  const changes = new Map(
    [
      ...parseNameStatus(
        git(root, [
          "diff",
          "--name-status",
          "-z",
          "-M",
          range,
          "--",
          options.source
        ])
      )
    ].filter(([path]) => isAnalyzed(path))
  );

  if (changes.size === 0) {
    return [];
  }

  const ruleset = resolve(root, options.ruleset);
  const headFindings = toFindings(
    runPmd({
      pmd,
      ruleset,
      files: [...changes.keys()],
      root,
      workDir,
      name: "head"
    }),
    root
  );

  // The base versions are written to a separate tree so their paths match the old repository paths.
  const modified = [...changes.values()].filter(
    (change) => change.status === "M"
  );
  const baseRoot = join(workDir, "base");
  for (const change of modified) {
    const target = join(baseRoot, change.oldPath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(
      target,
      git(root, ["show", `${options.base}:${change.oldPath}`])
    );
  }

  const baseFindings = modified.length
    ? toFindings(
        runPmd({
          pmd,
          ruleset,
          files: modified.map((change) => change.oldPath),
          root: baseRoot,
          workDir,
          name: "base"
        }),
        baseRoot
      )
    : [];

  const changedLines = parseChangedLines(
    git(root, [
      "diff",
      "-U0",
      "--no-color",
      "-M",
      range,
      "--",
      ...changes.keys()
    ])
  );

  return classifyFindings({
    headFindings,
    baseFindings,
    changes,
    changedLines
  });
};

const main = () => {
  const options = parseArgs(process.argv.slice(2));
  const root = resolve(options.root);
  options.ruleset = resolve(options.ruleset);
  const pmd = process.env.PMD_BIN ?? "pmd";
  const workDir = mkdtempSync(join(tmpdir(), "r1-pmd-"));

  const findings = options.base
    ? analyzeChange({ root, options, pmd, workDir })
    : toFindings(
        runPmd({
          pmd,
          ruleset: resolve(root, options.ruleset),
          files: git(root, ["ls-files", "--", options.source])
            .split("\n")
            .filter(isAnalyzed),
          root,
          workDir,
          name: "head"
        }),
        root
      ).map((finding) => ({ ...finding, status: "new" }));

  if (options.output) {
    writeFileSync(options.output, JSON.stringify(findings, null, 2));
  }

  const existing = findings.filter(
    (finding) => finding.status === "existing"
  ).length;
  printFindings(
    findings.filter((finding) => finding.status === "new"),
    "PMD"
  );
  console.log(`Pre-existing findings not counted: ${existing}.`);
};

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main();
  } catch (failure) {
    console.error(failure.message);
    process.exitCode = 2;
  }
}
