// Generates the "Rule reference" section of code-standards/README.md from ruleset.xml and check-new-files.mjs,
// so the table always matches the real rules and severities.
// Usage: node code-standards/scripts/rule-reference.mjs --write   (updates the README)
//        node code-standards/scripts/rule-reference.mjs --check   (exits with 1 when the README is out of date)
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../", import.meta.url));
const RULESET = `${dir}ruleset.xml`;
const NEW_FILES_SCRIPT = `${dir}scripts/check-new-files.mjs`;
const README = `${dir}README.md`;
const START = "<!-- rule-reference:start -->";
const END = "<!-- rule-reference:end -->";

const CATEGORIES = [
  "Complexity and size",
  "Readability and dead code",
  "Triggers",
  "Security",
  "Queries, DML and asynchronous Apex",
  "Error handling",
  "Tests",
  "Naming",
  "Comments",
  "Flows",
  "Validation Rules",
  "Custom fields",
  "New files"
];

// [category, what the rule checks] for every rule. Custom rules use their own message when no text is given here.
const RULES = {
  CyclomaticComplexity: [
    "Complexity and size",
    "Independent paths through a method or class"
  ],
  CyclomaticComplexityTarget: [
    "Complexity and size",
    "Independent paths through a method or class"
  ],
  CognitiveComplexity: [
    "Complexity and size",
    "How hard a method is to understand"
  ],
  CognitiveComplexityTarget: [
    "Complexity and size",
    "How hard a method is to understand"
  ],
  NcssCount: ["Complexity and size", "Lines of code of a method or class"],
  NcssCountTarget: [
    "Complexity and size",
    "Lines of code of a method or class"
  ],
  NcssCountTestClass: ["Complexity and size", "Lines of code of a test class"],
  NcssCountTestClassTarget: [
    "Complexity and size",
    "Lines of code of a test class"
  ],
  ExcessiveParameterList: ["Complexity and size", "Parameters per method"],
  ExcessiveParameterListTarget: [
    "Complexity and size",
    "Parameters per method"
  ],
  TooManyFields: ["Complexity and size", "Fields per class"],
  TooManyFieldsTarget: ["Complexity and size", "Fields per class"],
  AvoidDeeplyNestedIfStmts: [
    "Complexity and size",
    "Nesting depth of if statements"
  ],
  AvoidDeeplyNestedIfStmtsTarget: [
    "Complexity and size",
    "Nesting depth of if statements"
  ],
  R1TooManyMethods: [
    "Complexity and size",
    "Methods per class (constructors excluded)"
  ],
  R1TooManyMethodsTarget: [
    "Complexity and size",
    "Methods per class (constructors excluded)"
  ],
  IfStmtsMustUseBraces: ["Readability and dead code", "`if` without braces"],
  IfElseStmtsMustUseBraces: [
    "Readability and dead code",
    "`if`/`else` without braces"
  ],
  ForLoopsMustUseBraces: ["Readability and dead code", "`for` without braces"],
  WhileLoopsMustUseBraces: [
    "Readability and dead code",
    "`while` without braces"
  ],
  OneDeclarationPerLine: [
    "Readability and dead code",
    "Several variables declared on one line"
  ],
  UnusedLocalVariable: [
    "Readability and dead code",
    "Local variables that are never used"
  ],
  UnusedMethod: [
    "Readability and dead code",
    "Private methods that are never called"
  ],
  EmptyIfStmt: ["Readability and dead code", "Empty `if` blocks"],
  EmptyWhileStmt: ["Readability and dead code", "Empty `while` blocks"],
  EmptyTryOrFinallyBlock: [
    "Readability and dead code",
    "Empty `try` or `finally` blocks"
  ],
  EmptyStatementBlock: ["Readability and dead code", "Other empty blocks"],
  DebugsShouldUseLoggingLevel: [
    "Readability and dead code",
    "`System.debug` without a logging level"
  ],
  AvoidLogicInTrigger: [
    "Triggers",
    "Logic inside the trigger instead of its handler"
  ],
  AvoidDirectAccessTriggerMap: [
    "Triggers",
    "Direct access such as `Trigger.new[0]`"
  ],
  R1HandlerExtendsBase: [
    "Triggers",
    "Handlers not extending `R1_TriggerHandler` (managed-package frameworks excluded)"
  ],
  ApexSharingViolations: [
    "Security",
    "Classes with SOQL/DML and no sharing declaration"
  ],
  ApexCRUDViolation: [
    "Security",
    "SOQL/DML without CRUD/FLS checks or user mode (custom metadata excluded)"
  ],
  ApexSOQLInjection: ["Security", "Dynamic SOQL built from unescaped input"],
  ApexSuggestUsingNamedCred: [
    "Security",
    "Callouts with hardcoded credentials"
  ],
  ApexInsecureEndpoint: ["Security", "Callouts to `http://` endpoints"],
  ApexCSRF: ["Security", "DML in constructors or init methods"],
  AvoidHardcodingId: [
    "Security",
    "Hardcoded record Ids (test classes excluded)"
  ],
  OperationWithLimitsInLoop: [
    "Queries, DML and asynchronous Apex",
    "SOQL, DML and other limited operations inside loops"
  ],
  OperationWithHighCostInLoop: [
    "Queries, DML and asynchronous Apex",
    "Expensive calls (describe, JSON...) inside loops"
  ],
  AvoidNonRestrictiveQueries: [
    "Queries, DML and asynchronous Apex",
    "Queries without `WHERE` or `LIMIT`"
  ],
  R1SoqlOnlyInSelector: [
    "Queries, DML and asynchronous Apex",
    "Queries outside `*Selector` classes (test classes excluded)"
  ],
  AvoidFutureAnnotation: [
    "Queries, DML and asynchronous Apex",
    "`@future` instead of Queueable"
  ],
  QueueableWithoutFinalizer: [
    "Queries, DML and asynchronous Apex",
    "Queueable jobs without a finalizer"
  ],
  AvoidGlobalModifier: [
    "Queries, DML and asynchronous Apex",
    "`global` where `public` would do"
  ],
  EmptyCatchBlock: ["Error handling", "Empty `catch` blocks"],
  R1AuraExceptionSetMessage: [
    "Error handling",
    "`AuraHandledException` thrown without `setMessage`"
  ],
  ApexUnitTestClassShouldHaveAsserts: [
    "Tests",
    "Test methods without assertions (`assert…` helpers count)"
  ],
  ApexAssertionsShouldIncludeMessage: ["Tests", "Assertions without a message"],
  ApexUnitTestShouldNotUseSeeAllDataTrue: ["Tests", "`SeeAllData=true`"],
  ApexUnitTestMethodShouldHaveIsTestAnnotation: [
    "Tests",
    "Test methods without `@IsTest`"
  ],
  TestMethodsMustBeInTestClasses: [
    "Tests",
    "Test methods outside test classes"
  ],
  R1UseAssertClass: ["Tests", "`System.assert*` instead of the `Assert` class"],
  ClassNamingConventions: ["Naming", "Class names in Pascal Case"],
  MethodNamingConventions: [
    "Naming",
    "Method names in camel Case; test methods `should…_When…` or `should…When…`"
  ],
  FieldNamingConventions: ["Naming", "Field names; constants in `SNAKE_CASE`"],
  FormalParameterNamingConventions: ["Naming", "Parameter names in camel Case"],
  LocalVariableNamingConventions: [
    "Naming",
    "Local variable names in camel Case"
  ],
  PropertyNamingConventions: ["Naming", "Property names in camel Case"],
  MethodWithSameNameAsEnclosingClass: [
    "Naming",
    "Methods named like their class"
  ],
  AvoidNonExistentAnnotations: ["Naming", "Annotations that do not exist"],
  R1InterfaceNaming: ["Naming", "Top-level interfaces named `R1_I…`"],
  R1EnumNaming: ["Naming", "Top-level enums named `R1_…`"],
  ApexDoc: [
    "Comments",
    "ApexDoc header on every class (method comments are optional)"
  ],
  R1NoAuthorTags: [
    "Comments",
    "`@author`, `@date`, `@company` or `@changes` in ApexDoc"
  ],
  R1FlowMissingFaultPath: [
    "Flows",
    "Get/Create/Update/Delete Records and Action elements without a fault path"
  ],
  R1FlowMissingDescription: ["Flows", "Flows without a description"],
  R1FlowMissingEntryCriteria: [
    "Flows",
    "Record-triggered Flows without entry conditions"
  ],
  R1FlowBypassPermission: [
    "Flows",
    "Record-triggered Flows without `$Permission.R1_BypassTriggers` in the entry formula"
  ],
  R1FlowTooManyElements: ["Flows", "Elements per Flow"],
  R1FlowDbInLoop: ["Flows", "Get/Create/Update/Delete Records inside a loop"],
  R1FlowResourceNaming: [
    "Flows",
    "Resource prefixes (`varB_`, `forN_`, `con_`, `textT_`…)"
  ],
  R1HardcodedIdInMetadata: [
    "Flows",
    "Hardcoded record Ids in Flow values and formulas, and in Validation Rule formulas"
  ],
  R1ValidationRuleMissingDescription: [
    "Validation Rules",
    "Validation Rules without a description"
  ],
  R1ValidationRuleErrorLocation: [
    "Validation Rules",
    "Error shown at the top of the page when the rule checks one field"
  ],
  R1FieldMissingDescription: [
    "Custom fields",
    "Custom fields without a description"
  ],
  R1FieldBooleanNaming: [
    "Custom fields",
    "Checkbox fields not starting with `Is`, `Has` or `Can`"
  ],
  R1FieldDateNaming: [
    "Custom fields",
    "Date fields not ending in `Date`, Date/Time fields not ending in `DateTime`"
  ],
  R1FieldLookupNaming: [
    "Custom fields",
    "Lookup and master-detail fields ending in `Id`"
  ],
  R1ApexClassName: ["New files", "Apex classes named `R1_<PascalCase>`"],
  R1TestClassSuffix: [
    "New files",
    "Test classes end with `_Test` (`Factory`/`Mock` for test support); only test classes do"
  ],
  R1TriggerName: ["New files", "Triggers named `R1_<Object>Trigger`"],
  R1OneTriggerPerObject: ["New files", "A second trigger on the same object"],
  R1LwcName: ["New files", "LWC folders named `r1_<camelCase>`, without `Cmp`"],
  R1AuraName: [
    "New files",
    "Aura bundles `R1_<PascalCase>`, events `R1_<Name>Evt`"
  ],
  R1VisualforceName: [
    "New files",
    "Visualforce pages `R1_<PascalCase>`, components `R1_<PascalCase>Cmp`"
  ],
  R1CustomObjectName: [
    "New files",
    "Custom objects, metadata types and platform events named `R1_<PascalCase>`"
  ],
  R1CustomFieldName: [
    "New files",
    "Custom fields named `R1_<PascalCase>__c` (namespaced fields skipped)"
  ],
  R1ValidationRuleName: [
    "New files",
    "Validation Rules named `R1_<FieldOrTopic>_<Condition>`"
  ],
  R1FlowName: ["New files", "Flow API names starting with `R1_`"],
  R1FlowLabel: [
    "New files",
    "Flow labels following the pattern of their type (`Record-Trigger: <Object> After Save`…)"
  ],
  R1FlowApiName: ["New files", "Flow API name equal to `R1_` + label"],
  R1MetadataPrefix: [
    "New files",
    "`R1_` prefix on permission sets, custom permissions, record types, apps, tabs and other metadata"
  ]
};

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
      `Add a category and description to RULES in rule-reference.mjs for: ${missing.join(", ")}`
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
    const inCategory = rules.filter((rule) => RULES[rule.name][0] === category);
    if (inCategory.length === 0) {
      continue;
    }
    lines.push(
      `#### ${category}`,
      "",
      "| Rule | Checks | Threshold | Severity |",
      "| --- | --- | --- | --- |"
    );
    for (const rule of inCategory) {
      counts[rule.severity]++;
      lines.push(
        `| \`${rule.name}\` | ${escapeCell(RULES[rule.name][1])} | ${rule.threshold || "—"} | ${rule.severity} |`
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
