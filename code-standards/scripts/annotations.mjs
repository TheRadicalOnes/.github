// Prints findings as GitHub workflow annotations (when GITHUB_ACTIONS=true) or as plain lines.
// A finding has: file, line, rule, severity ("error" | "warning"), message and, for built-in PMD rules, docsUrl and
// details (PMD's description as plain text). Annotations add the details, the section of the Code Conventions, a
// link to the rule reference and the PMD docs link.
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
 * Builds an annotation's text: the message, PMD's description (built-in rules only) and the Conventions section
 * with the rule reference and PMD docs links, separated by blank lines.
 */
export const describeFinding = (finding) => {
  const entry = RULES[finding.rule];
  const context = [
    entry && `Conventions: ${entry.section}`,
    entry && `Rule reference: ${ruleDocUrl(finding.rule)}`,
    finding.docsUrl && `PMD docs: ${finding.docsUrl}`
  ].filter(Boolean);

  return [finding.message, finding.details, context.join(" · ")]
    .filter(Boolean)
    .join("\n\n");
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
