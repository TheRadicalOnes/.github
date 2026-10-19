// Checks the naming conventions that only apply to NEW components: the R1_ prefix, the _Test suffix, trigger,
// LWC, Aura, Visualforce, object, field, Validation Rule and Flow names, and one trigger per object.
// Existing components keep their original name (Code Conventions, "R1_ Prefix Policy", Exceptions).
//
// Usage (from the repository to check, or with --root <dir>):
//   node code-standards/scripts/check-new-files.mjs --base <ref> [--head <ref>] [--output findings.json]
//   node code-standards/scripts/check-new-files.mjs --files <path>... [--output findings.json]
// Package directories and namespace come from sfdx-project.json; without it, force-app and no namespace.
// Prints GitHub annotations when GITHUB_ACTIONS=true. Exits with 1 when there is at least one error, and with 2
// when the check itself fails (bad arguments, git error), so CI can tell findings from crashes.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { printFindings } from "./annotations.mjs";

const PASCAL = "[A-Z][A-Za-z0-9]*";

// Names with a namespace (for example OrderApi__Item__c) belong to a managed package.
const NAMESPACED = /^[A-Za-z][A-Za-z0-9]*__[A-Za-z]/;

const RECORD_TRIGGER_LABELS = {
  RecordBeforeSave: "Before Save",
  RecordAfterSave: "After Save",
  RecordBeforeDelete: "Before Delete"
};

const toPosix = (path) => path.split(sep).join("/");

const error = (file, rule, message) => ({
  file,
  line: 1,
  rule,
  severity: "error",
  message
});

const warning = (file, rule, message) => ({
  ...error(file, rule, message),
  severity: "warning"
});

const stripApexComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

/**
 * Tells whether the top-level type of an Apex file is annotated with @IsTest.
 */
const isTestClass = (source) => {
  const code = stripApexComments(source);
  const declaration = code.search(/\b(class|interface|enum)\s+\w+/i);
  return declaration >= 0 && /@IsTest\b/i.test(code.slice(0, declaration));
};

const decodeXml = (text) =>
  text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

/**
 * Returns the text of the direct children of the root element, by tag name. Flow elements have their own
 * <label>, so the Flow label must be read at depth 1 only.
 */
const topLevelValues = (xml) => {
  const values = {};
  const tagPattern = /<(\/?)([A-Za-z][\w.-]*)[^>]*?(\/?)>/g;
  let depth = 0;
  let openTag = null;
  let openEnd = 0;
  let match;

  while ((match = tagPattern.exec(xml)) !== null) {
    const [whole, closing, name, selfClosing] = match;
    if (whole.startsWith("<?")) {
      continue;
    }
    if (selfClosing) {
      continue;
    }
    if (!closing) {
      depth++;
      if (depth === 2) {
        openTag = name;
        openEnd = tagPattern.lastIndex;
      }
      continue;
    }
    if (depth === 2 && name === openTag) {
      values[name] ??= xml.slice(openEnd, match.index);
    }
    depth--;
  }

  return values;
};

const innerValue = (xml, tag) => {
  const match = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(xml ?? "");
  return match ? decodeXml(match[1].trim()) : "";
};

const checkApexClass = (file, name, source) => {
  const findings = [];
  const isTest = isTestClass(source);

  if (!new RegExp(`^R1_${PASCAL}(_Test)?$`).test(name)) {
    findings.push(
      error(
        file,
        "R1ApexClassName",
        `Apex class ${name} must start with R1_ followed by Pascal Case.`
      )
    );
  }

  if (isTest && !/(_Test|Factory|Mock)$/.test(name)) {
    findings.push(
      error(
        file,
        "R1TestClassSuffix",
        `Test class ${name} must end with _Test, or with Factory or Mock if it only supports tests.`
      )
    );
  }

  if (!isTest && name.endsWith("_Test")) {
    findings.push(
      error(
        file,
        "R1TestClassSuffix",
        `${name} ends with _Test but is not annotated with @IsTest.`
      )
    );
  }

  return findings;
};

const triggerObject = (source) =>
  /\btrigger\s+\w+\s+on\s+(\w+)/i.exec(stripApexComments(source))?.[1];

const expectedTriggerName = (objectName) =>
  `R1_${objectName.replace(/__c$/i, "").replace(/^R1_/, "").replace(/_/g, "")}Trigger`;

const checkTrigger = (file, name, source, triggersByObject) => {
  const findings = [];
  const objectName = triggerObject(source);

  if (!objectName) {
    return findings;
  }

  const expected = expectedTriggerName(objectName);
  if (name !== expected) {
    findings.push(
      error(
        file,
        "R1TriggerName",
        `Trigger on ${objectName} must be named ${expected}.`
      )
    );
  }

  const others = (triggersByObject.get(objectName.toLowerCase()) ?? []).filter(
    (other) => other !== file
  );
  if (others.length > 0) {
    findings.push(
      error(
        file,
        "R1OneTriggerPerObject",
        `${objectName} already has a trigger (${others.join(", ")}). Each object must have exactly one trigger.`
      )
    );
  }

  return findings;
};

const flowLabelPattern = (processType, triggerType) => {
  if (processType === "Flow") {
    return {
      pattern: /^Screen Flow: \S.*$/,
      example: "Screen Flow: <Object> <Description>"
    };
  }
  if (RECORD_TRIGGER_LABELS[triggerType]) {
    const suffix = RECORD_TRIGGER_LABELS[triggerType];
    return {
      pattern: new RegExp(`^Record-Trigger: \\S.* ${suffix}$`),
      example: `Record-Trigger: <Object> ${suffix}`
    };
  }
  if (triggerType === "Scheduled") {
    return {
      pattern: /^\S.* Schedule: \S.*$/,
      example: "<Object> Schedule: <Description>"
    };
  }
  if (triggerType === "PlatformEvent") {
    return {
      pattern: /^Platform Event-Trigger: \S.*$/,
      example: "Platform Event-Trigger: <Description>"
    };
  }
  if (processType === "AutoLaunchedFlow") {
    return { pattern: /^Subflow: \S.*$/, example: "Subflow: <Description>" };
  }
  return { pattern: /^[^:]+: \S.*$/, example: "<Flow Type>: <Description>" };
};

const checkFlow = (file, name, xml) => {
  const findings = [];

  if (!new RegExp("^R1_[A-Za-z0-9_]+$").test(name)) {
    findings.push(
      error(file, "R1FlowName", `Flow API name ${name} must start with R1_.`)
    );
  }

  const values = topLevelValues(xml);
  const label = decodeXml((values.label ?? "").trim());
  const processType = (values.processType ?? "").trim();
  const triggerType = innerValue(values.start, "triggerType");
  const { pattern, example } = flowLabelPattern(processType, triggerType);

  if (!pattern.test(label)) {
    findings.push(
      error(
        file,
        "R1FlowLabel",
        `Flow label "${label}" must follow the pattern "${example}".`
      )
    );
    return findings;
  }

  const expectedName = `R1_${label.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`;
  if (name !== expectedName) {
    findings.push(
      warning(
        file,
        "R1FlowApiName",
        `Flow API name should be ${expectedName}: the R1_ prefix followed by the label.`
      )
    );
  }

  return findings;
};

// Components that only need the R1_ prefix, or the prefix plus a fixed pattern.
const NAME_RULES = [
  {
    path: /\/lwc\/([^/]+)\/\1\.js-meta\.xml$/,
    rule: "R1LwcName",
    valid: (name) => /^r1_[a-z][A-Za-z0-9]*$/.test(name) && !/Cmp$/i.test(name),
    message: (name) =>
      `LWC ${name} must follow r1_<componentName> in camel Case, without a Cmp suffix.`
  },
  {
    path: /\/aura\/([^/]+)\/\1\.evt$/,
    rule: "R1AuraName",
    valid: (name) => new RegExp(`^R1_${PASCAL}Evt$`).test(name),
    message: (name) => `Aura event ${name} must follow R1_<EventName>Evt.`
  },
  {
    path: /\/aura\/([^/]+)\/\1\.(cmp|app)$/,
    rule: "R1AuraName",
    valid: (name) => new RegExp(`^R1_${PASCAL}$`).test(name),
    message: (name) =>
      `Aura bundle ${name} must start with R1_ followed by Pascal Case.`
  },
  {
    path: /\/pages\/([^/]+)\.page$/,
    rule: "R1VisualforceName",
    valid: (name) =>
      new RegExp(`^R1_${PASCAL}$`).test(name) && !name.endsWith("Cmp"),
    message: (name) =>
      `Visualforce page ${name} must follow R1_<ObjectOrController><Description>.`
  },
  {
    path: /\/components\/([^/]+)\.component$/,
    rule: "R1VisualforceName",
    valid: (name) => new RegExp(`^R1_${PASCAL}Cmp$`).test(name),
    message: (name) => `Visualforce component ${name} must end with Cmp.`
  },
  {
    path: /\/objects\/([^/]+)\/\1\.object-meta\.xml$/,
    rule: "R1CustomObjectName",
    applies: (name) =>
      /__(c|mdt|e)$/.test(name) &&
      !NAMESPACED.test(name.replace(/__(c|mdt|e)$/, "")),
    valid: (name) => new RegExp(`^R1_${PASCAL}__(c|mdt|e)$`).test(name),
    message: (name) =>
      `Custom object ${name} must start with R1_ followed by a singular Pascal Case name.`
  },
  {
    path: /\/objects\/[^/]+\/fields\/([^/]+)\.field-meta\.xml$/,
    rule: "R1CustomFieldName",
    applies: (name) =>
      name.endsWith("__c") && !NAMESPACED.test(name.replace(/__c$/, "")),
    valid: (name) => new RegExp(`^R1_${PASCAL}__c$`).test(name),
    message: (name) =>
      `Custom field ${name} must start with R1_ followed by Pascal Case.`
  },
  {
    path: /\/objects\/[^/]+\/validationRules\/([^/]+)\.validationRule-meta\.xml$/,
    rule: "R1ValidationRuleName",
    valid: (name) => new RegExp(`^R1_${PASCAL}_${PASCAL}$`).test(name),
    message: (name) =>
      `Validation Rule ${name} must follow R1_<FieldOrTopic>_<Condition>.`
  },
  ...[
    [
      /\/objects\/[^/]+\/recordTypes\/([^/]+)\.recordType-meta\.xml$/,
      "Record type"
    ],
    [/\/permissionsets\/([^/]+)\.permissionset-meta\.xml$/, "Permission set"],
    [
      /\/permissionsetgroups\/([^/]+)\.permissionsetgroup-meta\.xml$/,
      "Permission set group"
    ],
    [
      /\/customPermissions\/([^/]+)\.customPermission-meta\.xml$/,
      "Custom permission"
    ],
    [/\/flexipages\/([^/]+)\.flexipage-meta\.xml$/, "Lightning page"],
    [/\/applications\/([^/]+)\.app-meta\.xml$/, "App"],
    [/\/tabs\/([^/]+)\.tab-meta\.xml$/, "Tab"],
    [/\/staticresources\/([^/]+)\.resource-meta\.xml$/, "Static resource"],
    [
      /\/namedCredentials\/([^/]+)\.namedCredential-meta\.xml$/,
      "Named credential"
    ],
    [/\/email\/[^/]+\/([^/]+)\.email-meta\.xml$/, "Email template"]
  ].map(([path, type]) => ({
    path,
    rule: "R1MetadataPrefix",
    valid: (name) => new RegExp(`^R1_${PASCAL}`).test(name),
    message: (name) => `${type} ${name} must start with R1_.`
  }))
];

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });

const indexTriggers = (root, packageDirs) => {
  const triggersByObject = new Map();

  for (const packageDir of packageDirs) {
    for (const path of walk(resolve(root, packageDir)).filter((p) =>
      p.endsWith(".trigger")
    )) {
      const objectName = triggerObject(readFileSync(path, "utf8"));
      if (!objectName) {
        continue;
      }
      const key = objectName.toLowerCase();
      triggersByObject.set(key, [
        ...(triggersByObject.get(key) ?? []),
        toPosix(relative(root, path))
      ]);
    }
  }

  return triggersByObject;
};

/**
 * Checks the files added in a change.
 * @param {object} options
 * @param {string} options.root Repository root.
 * @param {string[]} options.addedFiles Added files, relative to the root.
 * @param {string[]} options.packageDirs Package directories from sfdx-project.json, relative to the root.
 * @param {string} [options.namespace] Package namespace. When set, it replaces the R1_ prefix and no check runs.
 * @returns {object[]} Findings with file, line, rule, severity and message.
 */
export const checkNewFiles = ({
  root,
  addedFiles,
  packageDirs,
  namespace = ""
}) => {
  if (namespace) {
    return [];
  }

  const inPackage = (file) =>
    packageDirs.some((dir) =>
      file.startsWith(`${toPosix(dir).replace(/\/$/, "")}/`)
    );
  const files = addedFiles.map(toPosix).filter(inPackage);
  const read = (file) => readFileSync(resolve(root, file), "utf8");
  const triggersByObject = files.some((file) => file.endsWith(".trigger"))
    ? indexTriggers(root, packageDirs)
    : new Map();

  return files.flatMap((file) => {
    const path = `/${file}`;
    let match;

    if ((match = /\/classes\/([^/]+)\.cls$/.exec(path))) {
      return checkApexClass(file, match[1], read(file));
    }
    if ((match = /\/triggers\/([^/]+)\.trigger$/.exec(path))) {
      return checkTrigger(file, match[1], read(file), triggersByObject);
    }
    if ((match = /\/flows\/([^/]+)\.flow-meta\.xml$/.exec(path))) {
      return checkFlow(file, match[1], read(file));
    }

    for (const nameRule of NAME_RULES) {
      match = nameRule.path.exec(path);
      if (!match) {
        continue;
      }
      const name = match[1];
      if (nameRule.applies && !nameRule.applies(name)) {
        return [];
      }
      return nameRule.valid(name)
        ? []
        : [error(file, nameRule.rule, nameRule.message(name))];
    }

    return [];
  });
};

const parseArgs = (args) => {
  const options = { files: [], root: process.cwd() };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (["--base", "--head", "--output", "--root"].includes(arg)) {
      options[arg.slice(2)] = args[++i];
    } else if (arg === "--files") {
      while (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        options.files.push(args[++i]);
      }
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
};

const addedFilesBetween = (root, base, head = "HEAD") =>
  execFileSync(
    "git",
    ["diff", "--name-only", "-z", "--diff-filter=A", `${base}...${head}`],
    {
      cwd: root,
      encoding: "utf8"
    }
  )
    .split("\0")
    .filter(Boolean);

const main = () => {
  const options = parseArgs(process.argv.slice(2));
  const root = resolve(options.root);
  const projectFile = resolve(root, "sfdx-project.json");
  const project = existsSync(projectFile)
    ? JSON.parse(readFileSync(projectFile, "utf8"))
    : { packageDirectories: [{ path: "force-app" }], namespace: "" };

  if (!options.base && options.files.length === 0) {
    throw new Error("Pass --base <ref> or --files <path>...");
  }

  const addedFiles = options.base
    ? addedFilesBetween(root, options.base, options.head)
    : options.files;
  const findings = checkNewFiles({
    root,
    addedFiles,
    packageDirs: project.packageDirectories.map((entry) => entry.path),
    namespace: project.namespace
  });

  if (options.output) {
    writeFileSync(options.output, JSON.stringify(findings, null, 2));
  }

  process.exitCode = printFindings(findings, "New files") > 0 ? 1 : 0;
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
