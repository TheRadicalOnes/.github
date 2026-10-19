// Builds the Job Summary of the Code Standards workflow from the check-pmd and check-new-files findings, and
// decides whether the job fails.
// Usage: node code-standards/scripts/summary.mjs [--pmd pmd-findings.json] [--new-files new-files.json]
// Only new findings count. Pre-existing findings (status "existing") are listed in a collapsed section.
// The job fails on new errors only when STANDARDS_ENFORCE is 'true' (adoption phase otherwise).
import { appendFileSync, existsSync, readFileSync } from "node:fs";

// Rows listed in each findings table; the counts always include every finding.
const MAX_ROWS = 200;

const parseArgs = (args) => {
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!["--pmd", "--new-files"].includes(args[i])) {
      throw new Error(`Unknown argument: ${args[i]}`);
    }
    options[args[i].slice(2)] = args[i + 1];
  }
  return options;
};

const readJson = (path) =>
  path && existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;

const escapeCell = (value) =>
  String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");

const countErrors = (findings) =>
  findings.filter((finding) => finding.severity === "error").length;

const findingsTable = (findings) => {
  const sorted = [...findings].sort(
    (a, b) =>
      (a.severity === "error" ? 0 : 1) - (b.severity === "error" ? 0 : 1) ||
      a.file.localeCompare(b.file) ||
      a.line - b.line
  );

  const rows = [
    "| Severity | File | Rule | Message |",
    "| --- | --- | --- | --- |",
    ...sorted
      .slice(0, MAX_ROWS)
      .map(
        (finding) =>
          `| ${finding.severity} | \`${escapeCell(finding.file)}:${finding.line}\` | ${finding.rule} | ${escapeCell(finding.message)} |`
      )
  ];

  if (sorted.length > MAX_ROWS) {
    rows.push(
      "",
      `Only the first ${MAX_ROWS} of ${sorted.length} findings are listed.`
    );
  }

  return rows;
};

const buildSummary = (newFindings, existingFindings, enforced) => {
  const errors = countErrors(newFindings);
  const mode = enforced
    ? "New errors fail this check."
    : "Adoption phase: errors are reported but do not fail this check (`STANDARDS_ENFORCE` is not `true`).";

  const lines = [
    "## R1 Code Standards",
    "",
    `**${errors} new error(s)**, **${newFindings.length - errors} new warning(s)**. ${mode}`,
    ""
  ];

  if (newFindings.length === 0) {
    lines.push("No new findings. :white_check_mark:");
  } else {
    const countsByRule = new Map();
    for (const finding of newFindings) {
      const key = `${finding.severity}|${finding.rule}`;
      countsByRule.set(key, (countsByRule.get(key) ?? 0) + 1);
    }

    lines.push("| Severity | Rule | Count |", "| --- | --- | --- |");
    for (const [key, count] of [...countsByRule].sort()) {
      const [severity, rule] = key.split("|");
      lines.push(`| ${severity} | ${rule} | ${count} |`);
    }

    lines.push(
      "",
      "<details><summary>New findings</summary>",
      "",
      ...findingsTable(newFindings),
      "",
      "</details>"
    );
  }

  if (existingFindings.length > 0) {
    lines.push(
      "",
      `<details><summary>Pre-existing findings in the modified files (${existingFindings.length}, not counted)</summary>`,
      "",
      "These were already in the base version of the files. They are not annotated and never fail the check.",
      "",
      ...findingsTable(existingFindings),
      "",
      "</details>"
    );
  }

  lines.push(
    "",
    "GitHub shows a limited number of annotations inline in Files changed; this summary lists every finding.",
    "Rules and severities: [TheRadicalOnes/.github code-standards](https://github.com/TheRadicalOnes/.github/tree/v1/code-standards)."
  );

  return lines.join("\n");
};

const main = () => {
  const options = parseArgs(process.argv.slice(2));
  const findings = [
    ...(readJson(options.pmd) ?? []),
    ...(readJson(options["new-files"]) ?? [])
  ];
  const newFindings = findings.filter(
    (finding) => finding.status !== "existing"
  );
  const existingFindings = findings.filter(
    (finding) => finding.status === "existing"
  );
  const enforced = process.env.STANDARDS_ENFORCE === "true";
  const summary = buildSummary(newFindings, existingFindings, enforced);

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  } else {
    console.log(summary);
  }

  const errors = countErrors(newFindings);
  console.log(
    `\nCode standards: ${errors} new error(s), ${newFindings.length - errors} new warning(s), ${existingFindings.length} pre-existing.`
  );

  if (enforced && errors > 0) {
    process.exitCode = 1;
  }
};

main();
