// Catalog of every code standards rule: category, what it checks and the section of the Code Conventions it
// comes from. An optional `details` replaces PMD's description in annotations when PMD's text does not match how
// the rule is configured here. Used by the annotations, the Job Summary and the rule reference in code-standards/README.md.
// A new rule (in ruleset.xml or check-new-files.mjs) needs an entry here; the tests fail until it has one.

export const CATEGORIES = [
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

export const RULES = {
  CyclomaticComplexity: {
    category: "Complexity and size",
    checks: "Independent paths through a method or class",
    section: "I · Complexity thresholds"
  },
  CyclomaticComplexityTarget: {
    category: "Complexity and size",
    checks: "Independent paths through a method or class",
    section: "I · Complexity thresholds"
  },
  CognitiveComplexity: {
    category: "Complexity and size",
    checks: "How hard a method is to understand",
    section: "I · Complexity thresholds"
  },
  CognitiveComplexityTarget: {
    category: "Complexity and size",
    checks: "How hard a method is to understand",
    section: "I · Complexity thresholds"
  },
  NcssCount: {
    category: "Complexity and size",
    checks: "Lines of code of a method or class",
    section: "I · Complexity thresholds"
  },
  NcssCountTarget: {
    category: "Complexity and size",
    checks: "Lines of code of a method or class",
    section: "I · Complexity thresholds"
  },
  NcssCountTestClass: {
    category: "Complexity and size",
    checks: "Lines of code of a test class",
    section: "I · Complexity thresholds"
  },
  NcssCountTestClassTarget: {
    category: "Complexity and size",
    checks: "Lines of code of a test class",
    section: "I · Complexity thresholds"
  },
  ExcessiveParameterList: {
    category: "Complexity and size",
    checks: "Parameters per method",
    section: "I · Complexity thresholds"
  },
  ExcessiveParameterListTarget: {
    category: "Complexity and size",
    checks: "Parameters per method",
    section: "I · Complexity thresholds"
  },
  TooManyFields: {
    category: "Complexity and size",
    checks: "Fields per class",
    section: "I · Complexity thresholds"
  },
  TooManyFieldsTarget: {
    category: "Complexity and size",
    checks: "Fields per class",
    section: "I · Complexity thresholds"
  },
  AvoidDeeplyNestedIfStmts: {
    category: "Complexity and size",
    checks: "Nesting depth of if statements",
    section: "I · Complexity thresholds"
  },
  AvoidDeeplyNestedIfStmtsTarget: {
    category: "Complexity and size",
    checks: "Nesting depth of if statements",
    section: "I · Complexity thresholds"
  },
  R1TooManyMethods: {
    category: "Complexity and size",
    checks: "Methods per class (constructors excluded)",
    section: "I · Complexity thresholds"
  },
  R1TooManyMethodsTarget: {
    category: "Complexity and size",
    checks: "Methods per class (constructors excluded)",
    section: "I · Complexity thresholds"
  },
  IfStmtsMustUseBraces: {
    category: "Readability and dead code",
    checks: "`if` without braces",
    section: "I · Use braces for blocks"
  },
  IfElseStmtsMustUseBraces: {
    category: "Readability and dead code",
    checks: "`if`/`else` without braces",
    section: "I · Use braces for blocks"
  },
  ForLoopsMustUseBraces: {
    category: "Readability and dead code",
    checks: "`for` without braces",
    section: "I · Use braces for blocks"
  },
  WhileLoopsMustUseBraces: {
    category: "Readability and dead code",
    checks: "`while` without braces",
    section: "I · Use braces for blocks"
  },
  OneDeclarationPerLine: {
    category: "Readability and dead code",
    checks: "Several variables declared on one line",
    section: "I · Focus on code readability"
  },
  UnusedLocalVariable: {
    category: "Readability and dead code",
    checks: "Local variables that are never used",
    section: "I · No dead code"
  },
  UnusedMethod: {
    category: "Readability and dead code",
    checks: "Private methods that are never called",
    section: "I · No dead code"
  },
  EmptyIfStmt: {
    category: "Readability and dead code",
    checks: "Empty `if` blocks",
    section: "I · No dead code"
  },
  EmptyWhileStmt: {
    category: "Readability and dead code",
    checks: "Empty `while` blocks",
    section: "I · No dead code"
  },
  EmptyTryOrFinallyBlock: {
    category: "Readability and dead code",
    checks: "Empty `try` or `finally` blocks",
    section: "I · No dead code"
  },
  EmptyStatementBlock: {
    category: "Readability and dead code",
    checks: "Other empty blocks",
    section: "I · No dead code"
  },
  DebugsShouldUseLoggingLevel: {
    category: "Readability and dead code",
    checks: "`System.debug` without a logging level",
    section: "I · Debuggability"
  },
  AvoidLogicInTrigger: {
    category: "Triggers",
    checks: "Logic inside the trigger instead of its handler",
    section: "II Rule 2"
  },
  AvoidDirectAccessTriggerMap: {
    category: "Triggers",
    checks: "Direct access such as `Trigger.new[0]`",
    section: "II Rule 5"
  },
  R1HandlerExtendsBase: {
    category: "Triggers",
    checks:
      "Handlers not extending `R1_TriggerHandler` (managed-package frameworks excluded)",
    section: "II Rule 3"
  },
  ApexSharingViolations: {
    category: "Security",
    checks: "Classes with SOQL/DML and no sharing declaration",
    section: "III Rule 2"
  },
  ApexCRUDViolation: {
    category: "Security",
    checks:
      "SOQL/DML without CRUD/FLS checks or user mode (custom metadata excluded)",
    section: "III Rule 3"
  },
  ApexSOQLInjection: {
    category: "Security",
    checks: "Dynamic SOQL built from unescaped input",
    section: "III Rule 3"
  },
  ApexSuggestUsingNamedCred: {
    category: "Security",
    checks: "Callouts with hardcoded credentials",
    section: "III Rule 3"
  },
  ApexInsecureEndpoint: {
    category: "Security",
    checks: "Callouts to `http://` endpoints",
    section: "III Rule 7"
  },
  ApexCSRF: {
    category: "Security",
    checks: "DML in constructors or init methods",
    section: "III Rule 3"
  },
  AvoidHardcodingId: {
    category: "Security",
    checks: "Hardcoded record Ids (test classes excluded)",
    section: "III Rule 7"
  },
  OperationWithLimitsInLoop: {
    category: "Queries, DML and asynchronous Apex",
    checks: "SOQL, DML and other limited operations inside loops",
    section: "II Rule 5, III Rule 4"
  },
  OperationWithHighCostInLoop: {
    category: "Queries, DML and asynchronous Apex",
    checks: "Expensive calls (describe, JSON...) inside loops",
    section: "II Rule 7"
  },
  AvoidNonRestrictiveQueries: {
    category: "Queries, DML and asynchronous Apex",
    checks: "Queries without `WHERE` or `LIMIT`",
    section: "III Rule 4"
  },
  R1SoqlOnlyInSelector: {
    category: "Queries, DML and asynchronous Apex",
    checks: "Queries outside `*Selector` classes (test classes excluded)",
    section: "III Rule 1"
  },
  AvoidFutureAnnotation: {
    category: "Queries, DML and asynchronous Apex",
    checks: "`@future` instead of Queueable",
    section: "III Rule 6"
  },
  QueueableWithoutFinalizer: {
    category: "Queries, DML and asynchronous Apex",
    checks: "Queueable jobs without a finalizer",
    section: "III Rule 6"
  },
  AvoidGlobalModifier: {
    category: "Queries, DML and asynchronous Apex",
    checks: "`global` where `public` would do",
    section: "I · Apex best practices"
  },
  EmptyCatchBlock: {
    category: "Error handling",
    checks: "Empty `catch` blocks",
    section: "III Rule 5"
  },
  R1AuraExceptionSetMessage: {
    category: "Error handling",
    checks: "`AuraHandledException` thrown without `setMessage`",
    section: "III Rule 5"
  },
  ApexUnitTestClassShouldHaveAsserts: {
    category: "Tests",
    checks: "Test methods without assertions (`assert…` helpers count)",
    section: "III Rule 8"
  },
  ApexAssertionsShouldIncludeMessage: {
    category: "Tests",
    checks: "Assertions without a message",
    section: "III Rule 8"
  },
  ApexUnitTestShouldNotUseSeeAllDataTrue: {
    category: "Tests",
    checks: "`SeeAllData=true`",
    section: "III Rule 8"
  },
  ApexUnitTestMethodShouldHaveIsTestAnnotation: {
    category: "Tests",
    checks: "Test methods without `@IsTest`",
    section: "III Rule 8"
  },
  TestMethodsMustBeInTestClasses: {
    category: "Tests",
    checks: "Test methods outside test classes",
    section: "III Rule 8"
  },
  R1UseAssertClass: {
    category: "Tests",
    checks: "`System.assert*` instead of the `Assert` class",
    section: "III Rule 8"
  },
  ClassNamingConventions: {
    category: "Naming",
    checks: "Class names in Pascal Case",
    section: "IV Rule 9"
  },
  MethodNamingConventions: {
    category: "Naming",
    checks:
      "Method names in camel Case; test methods `should…_When…` or `should…When…`",
    section: "IV Rules 12-13"
  },
  FieldNamingConventions: {
    category: "Naming",
    checks: "Field names; constants in `SNAKE_CASE`",
    section: "IV Rules 14, 16"
  },
  FormalParameterNamingConventions: {
    category: "Naming",
    checks: "Parameter names in camel Case",
    section: "IV Rule 15"
  },
  LocalVariableNamingConventions: {
    category: "Naming",
    checks: "Local variable names in camel Case",
    section: "IV Rule 15"
  },
  PropertyNamingConventions: {
    category: "Naming",
    checks: "Property names in camel Case",
    section: "IV Rule 14"
  },
  MethodWithSameNameAsEnclosingClass: {
    category: "Naming",
    checks: "Methods named like their class",
    section: "IV Rule 12"
  },
  AvoidNonExistentAnnotations: {
    category: "Naming",
    checks: "Annotations that do not exist",
    section: "I · Apex best practices"
  },
  R1InterfaceNaming: {
    category: "Naming",
    checks: "Top-level interfaces named `R1_I…`",
    section: "IV Rule 11"
  },
  R1EnumNaming: {
    category: "Naming",
    checks: "Top-level enums named `R1_…`",
    section: "IV Rule 11"
  },
  ApexDoc: {
    category: "Comments",
    checks: "ApexDoc header on every class (method comments are optional)",
    section: "VII Rule 3",
    // PMD's own description asks for method and property comments, which are optional in the R1 conventions.
    details:
      "Every class needs an ApexDoc header above its declaration that explains why the class exists. A description at the top of the comment is enough; the @description tag is optional. Method and property comments are optional in the R1 conventions: add them only when they add value."
  },
  R1NoAuthorTags: {
    category: "Comments",
    checks: "`@author`, `@date`, `@company` or `@changes` in ApexDoc",
    section: "VII Rule 3"
  },
  R1FlowMissingFaultPath: {
    category: "Flows",
    checks:
      "Get/Create/Update/Delete Records and Action elements without a fault path",
    section: "V Rule 6"
  },
  R1FlowMissingDescription: {
    category: "Flows",
    checks: "Flows without a description",
    section: "V Rule 6"
  },
  R1FlowMissingEntryCriteria: {
    category: "Flows",
    checks: "Record-triggered Flows without entry conditions",
    section: "V Rule 5"
  },
  R1FlowBypassPermission: {
    category: "Flows",
    checks:
      "Record-triggered Flows without `$Permission.R1_BypassTriggers` in the entry formula",
    section: "V Rule 6"
  },
  R1FlowTooManyElements: {
    category: "Flows",
    checks: "Elements per Flow",
    section: "V Rule 5"
  },
  R1FlowDbInLoop: {
    category: "Flows",
    checks: "Get/Create/Update/Delete Records inside a loop",
    section: "V Rule 5"
  },
  R1FlowResourceNaming: {
    category: "Flows",
    checks: "Resource prefixes (`varB_`, `forN_`, `con_`, `textT_`…)",
    section: "V Rule 3"
  },
  R1HardcodedIdInMetadata: {
    category: "Flows",
    checks:
      "Hardcoded record Ids in Flow values and formulas, and in Validation Rule formulas",
    section: "III Rule 7, VI Rule 3"
  },
  R1ValidationRuleMissingDescription: {
    category: "Validation Rules",
    checks: "Validation Rules without a description",
    section: "VI Rule 3"
  },
  R1ValidationRuleErrorLocation: {
    category: "Validation Rules",
    checks: "Error shown at the top of the page when the rule checks one field",
    section: "VI Rule 3"
  },
  R1FieldMissingDescription: {
    category: "Custom fields",
    checks: "Custom fields without a description",
    section: "IV Rule 7"
  },
  R1FieldBooleanNaming: {
    category: "Custom fields",
    checks: "Checkbox fields not starting with `Is`, `Has` or `Can`",
    section: "IV Rule 7"
  },
  R1FieldDateNaming: {
    category: "Custom fields",
    checks:
      "Date fields not ending in `Date`, Date/Time fields not ending in `DateTime`",
    section: "IV Rule 7"
  },
  R1FieldLookupNaming: {
    category: "Custom fields",
    checks: "Lookup and master-detail fields ending in `Id`",
    section: "IV Rule 7"
  },
  R1ApexClassName: {
    category: "New files",
    checks: "Apex classes named `R1_<PascalCase>`",
    section: "R1_ Prefix Policy, IV Rule 9"
  },
  R1TestClassSuffix: {
    category: "New files",
    checks:
      "Test classes end with `_Test` (`Factory`/`Mock` for test support); only test classes do",
    section: "IV Rule 10"
  },
  R1TriggerName: {
    category: "New files",
    checks: "Triggers named `R1_<Object>Trigger`",
    section: "II Rule 1"
  },
  R1OneTriggerPerObject: {
    category: "New files",
    checks: "A second trigger on the same object",
    section: "II Rule 1"
  },
  R1LwcName: {
    category: "New files",
    checks: "LWC folders named `r1_<camelCase>`, without `Cmp`",
    section: "IV Rule 17"
  },
  R1AuraName: {
    category: "New files",
    checks: "Aura bundles `R1_<PascalCase>`, events `R1_<Name>Evt`",
    section: "IV Rule 19"
  },
  R1VisualforceName: {
    category: "New files",
    checks:
      "Visualforce pages `R1_<PascalCase>`, components `R1_<PascalCase>Cmp`",
    section: "IV Rule 18"
  },
  R1CustomObjectName: {
    category: "New files",
    checks:
      "Custom objects, metadata types and platform events named `R1_<PascalCase>`",
    section: "IV Rule 6"
  },
  R1CustomFieldName: {
    category: "New files",
    checks:
      "Custom fields named `R1_<PascalCase>__c` (namespaced fields skipped)",
    section: "IV Rule 7"
  },
  R1ValidationRuleName: {
    category: "New files",
    checks: "Validation Rules named `R1_<FieldOrTopic>_<Condition>`",
    section: "VI Rule 2"
  },
  R1FlowName: {
    category: "New files",
    checks: "Flow API names starting with `R1_`",
    section: "V Rule 2"
  },
  R1FlowLabel: {
    category: "New files",
    checks:
      "Flow labels following the pattern of their type (`Record-Trigger: <Object> After Save`…)",
    section: "V Rule 2"
  },
  R1FlowApiName: {
    category: "New files",
    checks: "Flow API name equal to `R1_` + label",
    section: "V Rule 2"
  },
  R1MetadataPrefix: {
    category: "New files",
    checks:
      "`R1_` prefix on permission sets, custom permissions, record types, apps, tabs and other metadata",
    section: "R1_ Prefix Policy, IV Rule 8"
  }
};

const DOCS = "https://github.com/TheRadicalOnes/.github/blob";

const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/ /g, "-");

/**
 * Returns the link to a rule's category in the rule reference, or null for an unknown rule.
 * @param {string} rule Rule name.
 * @param {string} [ref] Ref of TheRadicalOnes/.github the docs are read from (STANDARDS_REF, default v1).
 */
export const ruleDocUrl = (rule, ref = process.env.STANDARDS_REF || "v1") => {
  const entry = RULES[rule];
  return entry
    ? `${DOCS}/${ref}/code-standards/README.md#${slug(entry.category)}`
    : null;
};
