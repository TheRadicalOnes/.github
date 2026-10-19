// Prints findings as GitHub workflow annotations (when GITHUB_ACTIONS=true) or as plain lines.
// A finding has: file, line, rule, severity ("error" | "warning") and message. Annotations add the section of the
// Code Conventions and a link to the rule reference.
import { RULES, ruleDocUrl } from "./rules.mjs";

const escapeProperty = (value) =>
  String(value)
    .replace(/%/g, "%25")
    .replace(/\r/g, "%0D")
    .replace(/\n/g, "%0A")
    .replace(/:/g, "%3A")
    .replace(/,/g, "%2C");

const escapeMessage = (value) =>
  String(value)
    .replace(/%/g, "%25")
    .replace(/\r/g, "%0D")
    .replace(/\n/g, "%0A");

/**
 * Prints the findings and returns the number of errors.
 * @param {object[]} findings Findings to print.
 * @param {string} label Name of the check, used in the closing count.
 * @returns {number} Number of findings with severity "error".
 */
/**
 * Adds the Conventions section and the rule reference link to a finding's message.
 */
export const describeFinding = (finding) => {
  const entry = RULES[finding.rule];
  if (!entry) {
    return finding.message;
  }
  return `${finding.message}\nConventions: ${entry.section} · Rule reference: ${ruleDocUrl(finding.rule)}`;
};

export const printFindings = (findings, label) => {
  const inGitHub = process.env.GITHUB_ACTIONS === "true";

  for (const finding of findings) {
    if (inGitHub) {
      console.log(
        `::${finding.severity} file=${escapeProperty(finding.file)},line=${finding.line},title=${escapeProperty(finding.rule)}::${escapeMessage(describeFinding(finding))}`
      );
    } else {
      console.log(
        `${finding.severity.toUpperCase()}  ${finding.file}:${finding.line}  [${finding.rule}] ${finding.message}`
      );
    }
  }

  const errors = findings.filter(
    (finding) => finding.severity === "error"
  ).length;
  console.log(
    `\n${label}: ${errors} error(s), ${findings.length - errors} warning(s).`
  );
  return errors;
};
