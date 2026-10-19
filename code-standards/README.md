# Code standards check

A reusable workflow that flags violations of the R1 "Code Conventions and Guidelines" document in every pull request
of a Salesforce repo. It reports **errors** (Must rules) and **warnings** (Should rules) as annotations in _Files
changed_ and lists every finding in the job summary. May rules and anything that needs judgment are left to the code
review.

| Path                                                                              | What it is                                                   |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [`.github/workflows/code-standards.yml`](../.github/workflows/code-standards.yml) | The reusable workflow repos call                             |
| [`ruleset.xml`](ruleset.xml)                                                      | PMD rules and severities                                     |
| [`scripts/`](scripts)                                                             | `check-pmd.mjs`, `check-new-files.mjs`, `summary.mjs`, tests |
| [`fixtures/`](fixtures)                                                           | Good/bad examples that test every custom rule                |

## Using it in a repo

Add this file to the repo as `.github/workflows/code-standards.yml`:

```yaml
name: Code Standards

on:
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: code-standards-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  standards:
    uses: TheRadicalOnes/.github/.github/workflows/code-standards.yml@v1
    with:
      enforce: ${{ vars.STANDARDS_ENFORCE == 'true' }}
```

| Input           | Default     | Use                                                                           |
| --------------- | ----------- | ----------------------------------------------------------------------------- |
| `enforce`       | `false`     | Fail the check when there are new errors                                      |
| `source-path`   | `force-app` | Folder analyzed by PMD                                                        |
| `pmd-version`   | `7.22.0`    | PMD version to download                                                       |
| `node-version`  | `22`        | Node.js version used by the scripts                                           |
| `standards-ref` | `v1`        | Ref to take the ruleset and scripts from; keep it equal to the ref in `uses:` |

To try a branch of this repo before it is released, set both the `uses:` ref and `standards-ref` to that branch.

### Adoption phase

With the caller above, the job only fails on new errors when the repository variable `STANDARDS_ENFORCE` is `true`
(_Settings → Secrets and variables → Actions → Variables_). Until then it reports without blocking. Once it is
enforced, make **R1 code standards** a required status check in branch protection.

## How it works

| Step                | Tool                          | Scope                                        |
| ------------------- | ----------------------------- | -------------------------------------------- |
| PMD                 | `scripts/check-pmd.mjs`       | Added and modified files under `source-path` |
| Naming of new files | `scripts/check-new-files.mjs` | Files **added** by the pull request          |
| Summary             | `scripts/summary.mjs`         | Counts, full lists and pass/fail             |

- The job checks out the calling repo and, next to it, this repo at `standards-ref`. This repo is public, so no
  token is needed.
- In PMD, priority 1 rules are errors and priority 3 rules are warnings.
- Naming and the `R1_` prefix are only enforced on new components. Existing components keep their name.
- A manual run (`workflow_dispatch`) analyzes all of `source-path` with PMD and skips the new-files check.
- PMD is downloaded once and cached between runs (`actions/cache`).

### Only new findings count

Touching a legacy file must not surface its old problems. `check-pmd.mjs` also runs PMD on the base version of
every modified file and compares both results by rule and message, not by line, so code that only moved is not
reported:

- A finding is **new** when the pull request introduces it, or makes it worse (for example, a method's complexity
  goes from 11 to 13, which changes the message).
- When a file has more findings of a rule than before, the ones on changed lines are the new ones.
- Every finding of an added file is new.
- **Pre-existing** findings are listed in a collapsed section of the summary. They are not annotated and never
  fail the check.

## Rules

**Error** rules come from the Must rules of the Code Conventions and fail the check when it is enforced.
**Warning** rules come from the Should rules and never fail it. Thresholds are inclusive: "≥11" means 11 or more.
The "New files" rules run only on files the pull request adds; all other rules run on added and modified files.

Package directories and the namespace for the new-files rules come from the repo's `sfdx-project.json` (without it:
`force-app`, no namespace). When the project has a namespace, the namespace replaces the prefix and no naming check
runs.

### Rule reference

<!-- rule-reference:start -->

_Generated from `ruleset.xml` and `scripts/check-new-files.mjs` by `npm run standards:rules`. Do not edit by hand._

**93 rules:** 47 errors and 46 warnings. Rules ending in `Target` are the warning copies of a limit.

#### Complexity and size

| Rule                             | Checks                                      | Threshold                                  | Severity | Conventions               |
| -------------------------------- | ------------------------------------------- | ------------------------------------------ | -------- | ------------------------- |
| `CyclomaticComplexity`           | Independent paths through a method or class | ≥11 per method, ≥81 per class              | Error    | I · Complexity thresholds |
| `CyclomaticComplexityTarget`     | Independent paths through a method or class | ≥8 per method, ≥41 per class               | Warning  | I · Complexity thresholds |
| `CognitiveComplexity`            | How hard a method is to understand          | ≥16 per method                             | Error    | I · Complexity thresholds |
| `CognitiveComplexityTarget`      | How hard a method is to understand          | ≥11 per method                             | Warning  | I · Complexity thresholds |
| `NcssCount`                      | Lines of code of a method or class          | ≥51 lines per method, ≥501 lines per class | Error    | I · Complexity thresholds |
| `NcssCountTarget`                | Lines of code of a method or class          | ≥31 lines per method, ≥301 lines per class | Warning  | I · Complexity thresholds |
| `NcssCountTestClass`             | Lines of code of a test class               | ≥1001 lines per test class                 | Error    | I · Complexity thresholds |
| `NcssCountTestClassTarget`       | Lines of code of a test class               | ≥501 lines per test class                  | Warning  | I · Complexity thresholds |
| `ExcessiveParameterList`         | Parameters per method                       | ≥5 parameters                              | Error    | I · Complexity thresholds |
| `ExcessiveParameterListTarget`   | Parameters per method                       | ≥4 parameters                              | Warning  | I · Complexity thresholds |
| `TooManyFields`                  | Fields per class                            | ≥16 fields                                 | Error    | I · Complexity thresholds |
| `TooManyFieldsTarget`            | Fields per class                            | ≥11 fields                                 | Warning  | I · Complexity thresholds |
| `AvoidDeeplyNestedIfStmts`       | Nesting depth of if statements              | 4 or more levels                           | Error    | I · Complexity thresholds |
| `AvoidDeeplyNestedIfStmtsTarget` | Nesting depth of if statements              | 3 or more levels                           | Warning  | I · Complexity thresholds |
| `R1TooManyMethods`               | Methods per class (constructors excluded)   | ≥26 methods                                | Error    | I · Complexity thresholds |
| `R1TooManyMethodsTarget`         | Methods per class (constructors excluded)   | ≥16 methods                                | Warning  | I · Complexity thresholds |

#### Readability and dead code

| Rule                          | Checks                                 | Threshold | Severity | Conventions                   |
| ----------------------------- | -------------------------------------- | --------- | -------- | ----------------------------- |
| `IfStmtsMustUseBraces`        | `if` without braces                    | —         | Error    | I · Use braces for blocks     |
| `IfElseStmtsMustUseBraces`    | `if`/`else` without braces             | —         | Error    | I · Use braces for blocks     |
| `ForLoopsMustUseBraces`       | `for` without braces                   | —         | Error    | I · Use braces for blocks     |
| `WhileLoopsMustUseBraces`     | `while` without braces                 | —         | Error    | I · Use braces for blocks     |
| `OneDeclarationPerLine`       | Several variables declared on one line | —         | Warning  | I · Focus on code readability |
| `UnusedLocalVariable`         | Local variables that are never used    | —         | Error    | I · No dead code              |
| `UnusedMethod`                | Private methods that are never called  | —         | Warning  | I · No dead code              |
| `EmptyIfStmt`                 | Empty `if` blocks                      | —         | Error    | I · No dead code              |
| `EmptyWhileStmt`              | Empty `while` blocks                   | —         | Error    | I · No dead code              |
| `EmptyTryOrFinallyBlock`      | Empty `try` or `finally` blocks        | —         | Error    | I · No dead code              |
| `EmptyStatementBlock`         | Other empty blocks                     | —         | Warning  | I · No dead code              |
| `DebugsShouldUseLoggingLevel` | `System.debug` without a logging level | —         | Warning  | I · Debuggability             |

#### Triggers

| Rule                          | Checks                                                                           | Threshold | Severity | Conventions |
| ----------------------------- | -------------------------------------------------------------------------------- | --------- | -------- | ----------- |
| `AvoidLogicInTrigger`         | Logic inside the trigger instead of its handler                                  | —         | Error    | II Rule 2   |
| `AvoidDirectAccessTriggerMap` | Direct access such as `Trigger.new[0]`                                           | —         | Error    | II Rule 5   |
| `R1HandlerExtendsBase`        | Handlers not extending `R1_TriggerHandler` (managed-package frameworks excluded) | —         | Warning  | II Rule 3   |

#### Security

| Rule                        | Checks                                                                   | Threshold | Severity | Conventions |
| --------------------------- | ------------------------------------------------------------------------ | --------- | -------- | ----------- |
| `ApexSharingViolations`     | Classes with SOQL/DML and no sharing declaration                         | —         | Error    | III Rule 2  |
| `ApexCRUDViolation`         | SOQL/DML without CRUD/FLS checks or user mode (custom metadata excluded) | —         | Error    | III Rule 3  |
| `ApexSOQLInjection`         | Dynamic SOQL built from unescaped input                                  | —         | Error    | III Rule 3  |
| `ApexSuggestUsingNamedCred` | Callouts with hardcoded credentials                                      | —         | Error    | III Rule 3  |
| `ApexInsecureEndpoint`      | Callouts to `http://` endpoints                                          | —         | Error    | III Rule 7  |
| `ApexCSRF`                  | DML in constructors or init methods                                      | —         | Error    | III Rule 3  |
| `AvoidHardcodingId`         | Hardcoded record Ids (test classes excluded)                             | —         | Error    | III Rule 7  |

#### Queries, DML and asynchronous Apex

| Rule                          | Checks                                                      | Threshold | Severity | Conventions             |
| ----------------------------- | ----------------------------------------------------------- | --------- | -------- | ----------------------- |
| `OperationWithLimitsInLoop`   | SOQL, DML and other limited operations inside loops         | —         | Error    | II Rule 5, III Rule 4   |
| `OperationWithHighCostInLoop` | Expensive calls (describe, JSON...) inside loops            | —         | Warning  | II Rule 7               |
| `AvoidNonRestrictiveQueries`  | Queries without `WHERE` or `LIMIT`                          | —         | Warning  | III Rule 4              |
| `R1SoqlOnlyInSelector`        | Queries outside `*Selector` classes (test classes excluded) | —         | Warning  | III Rule 1              |
| `AvoidFutureAnnotation`       | `@future` instead of Queueable                              | —         | Warning  | III Rule 6              |
| `QueueableWithoutFinalizer`   | Queueable jobs without a finalizer                          | —         | Warning  | III Rule 6              |
| `AvoidGlobalModifier`         | `global` where `public` would do                            | —         | Warning  | I · Apex best practices |

#### Error handling

| Rule                        | Checks                                             | Threshold | Severity | Conventions |
| --------------------------- | -------------------------------------------------- | --------- | -------- | ----------- |
| `EmptyCatchBlock`           | Empty `catch` blocks                               | —         | Error    | III Rule 5  |
| `R1AuraExceptionSetMessage` | `AuraHandledException` thrown without `setMessage` | —         | Warning  | III Rule 5  |

#### Tests

| Rule                                           | Checks                                                    | Threshold | Severity | Conventions |
| ---------------------------------------------- | --------------------------------------------------------- | --------- | -------- | ----------- |
| `ApexUnitTestClassShouldHaveAsserts`           | Test methods without assertions (`assert…` helpers count) | —         | Error    | III Rule 8  |
| `ApexAssertionsShouldIncludeMessage`           | Assertions without a message                              | —         | Error    | III Rule 8  |
| `ApexUnitTestShouldNotUseSeeAllDataTrue`       | `SeeAllData=true`                                         | —         | Error    | III Rule 8  |
| `ApexUnitTestMethodShouldHaveIsTestAnnotation` | Test methods without `@IsTest`                            | —         | Error    | III Rule 8  |
| `TestMethodsMustBeInTestClasses`               | Test methods outside test classes                         | —         | Warning  | III Rule 8  |
| `R1UseAssertClass`                             | `System.assert*` instead of the `Assert` class            | —         | Warning  | III Rule 8  |

#### Naming

| Rule                                 | Checks                                                                     | Threshold | Severity | Conventions             |
| ------------------------------------ | -------------------------------------------------------------------------- | --------- | -------- | ----------------------- |
| `ClassNamingConventions`             | Class names in Pascal Case                                                 | —         | Warning  | IV Rule 9               |
| `MethodNamingConventions`            | Method names in camel Case; test methods `should…_When…` or `should…When…` | —         | Warning  | IV Rules 12-13          |
| `FieldNamingConventions`             | Field names; constants in `SNAKE_CASE`                                     | —         | Warning  | IV Rules 14, 16         |
| `FormalParameterNamingConventions`   | Parameter names in camel Case                                              | —         | Warning  | IV Rule 15              |
| `LocalVariableNamingConventions`     | Local variable names in camel Case                                         | —         | Warning  | IV Rule 15              |
| `PropertyNamingConventions`          | Property names in camel Case                                               | —         | Warning  | IV Rule 14              |
| `MethodWithSameNameAsEnclosingClass` | Methods named like their class                                             | —         | Warning  | IV Rule 12              |
| `AvoidNonExistentAnnotations`        | Annotations that do not exist                                              | —         | Warning  | I · Apex best practices |
| `R1InterfaceNaming`                  | Top-level interfaces named `R1_I…`                                         | —         | Warning  | IV Rule 11              |
| `R1EnumNaming`                       | Top-level enums named `R1_…`                                               | —         | Warning  | IV Rule 11              |

#### Comments

| Rule             | Checks                                                       | Threshold | Severity | Conventions |
| ---------------- | ------------------------------------------------------------ | --------- | -------- | ----------- |
| `ApexDoc`        | ApexDoc header on every class (method comments are optional) | —         | Error    | VII Rule 3  |
| `R1NoAuthorTags` | `@author`, `@date`, `@company` or `@changes` in ApexDoc      | —         | Warning  | VII Rule 3  |

#### Flows

| Rule                         | Checks                                                                              | Threshold    | Severity | Conventions           |
| ---------------------------- | ----------------------------------------------------------------------------------- | ------------ | -------- | --------------------- |
| `R1FlowMissingFaultPath`     | Get/Create/Update/Delete Records and Action elements without a fault path           | —            | Warning  | V Rule 6              |
| `R1FlowMissingDescription`   | Flows without a description                                                         | —            | Warning  | V Rule 6              |
| `R1FlowMissingEntryCriteria` | Record-triggered Flows without entry conditions                                     | —            | Warning  | V Rule 5              |
| `R1FlowBypassPermission`     | Record-triggered Flows without `$Permission.R1_BypassTriggers` in the entry formula | —            | Warning  | V Rule 6              |
| `R1FlowTooManyElements`      | Elements per Flow                                                                   | ≥51 elements | Error    | V Rule 5              |
| `R1FlowDbInLoop`             | Get/Create/Update/Delete Records inside a loop                                      | —            | Warning  | V Rule 5              |
| `R1FlowResourceNaming`       | Resource prefixes (`varB_`, `forN_`, `con_`, `textT_`…)                             | —            | Warning  | V Rule 3              |
| `R1HardcodedIdInMetadata`    | Hardcoded record Ids in Flow values and formulas, and in Validation Rule formulas   | —            | Error    | III Rule 7, VI Rule 3 |

#### Validation Rules

| Rule                                 | Checks                                                            | Threshold | Severity | Conventions |
| ------------------------------------ | ----------------------------------------------------------------- | --------- | -------- | ----------- |
| `R1ValidationRuleMissingDescription` | Validation Rules without a description                            | —         | Warning  | VI Rule 3   |
| `R1ValidationRuleErrorLocation`      | Error shown at the top of the page when the rule checks one field | —         | Warning  | VI Rule 3   |

#### Custom fields

| Rule                        | Checks                                                                      | Threshold | Severity | Conventions |
| --------------------------- | --------------------------------------------------------------------------- | --------- | -------- | ----------- |
| `R1FieldMissingDescription` | Custom fields without a description                                         | —         | Warning  | IV Rule 7   |
| `R1FieldBooleanNaming`      | Checkbox fields not starting with `Is`, `Has` or `Can`                      | —         | Warning  | IV Rule 7   |
| `R1FieldDateNaming`         | Date fields not ending in `Date`, Date/Time fields not ending in `DateTime` | —         | Warning  | IV Rule 7   |
| `R1FieldLookupNaming`       | Lookup and master-detail fields ending in `Id`                              | —         | Warning  | IV Rule 7   |

#### New files

| Rule                    | Checks                                                                                           | Threshold | Severity | Conventions                  |
| ----------------------- | ------------------------------------------------------------------------------------------------ | --------- | -------- | ---------------------------- |
| `R1ApexClassName`       | Apex classes named `R1_<PascalCase>`                                                             | —         | Error    | R1_ Prefix Policy, IV Rule 9 |
| `R1TestClassSuffix`     | Test classes end with `_Test` (`Factory`/`Mock` for test support); only test classes do          | —         | Error    | IV Rule 10                   |
| `R1TriggerName`         | Triggers named `R1_<Object>Trigger`                                                              | —         | Error    | II Rule 1                    |
| `R1OneTriggerPerObject` | A second trigger on the same object                                                              | —         | Error    | II Rule 1                    |
| `R1FlowName`            | Flow API names starting with `R1_`                                                               | —         | Error    | V Rule 2                     |
| `R1FlowLabel`           | Flow labels following the pattern of their type (`Record-Trigger: <Object> After Save`…)         | —         | Error    | V Rule 2                     |
| `R1FlowApiName`         | Flow API name equal to `R1_` + label                                                             | —         | Warning  | V Rule 2                     |
| `R1LwcName`             | LWC folders named `r1_<camelCase>`, without `Cmp`                                                | —         | Error    | IV Rule 17                   |
| `R1AuraName`            | Aura bundles `R1_<PascalCase>`, events `R1_<Name>Evt`                                            | —         | Error    | IV Rule 19                   |
| `R1VisualforceName`     | Visualforce pages `R1_<PascalCase>`, components `R1_<PascalCase>Cmp`                             | —         | Error    | IV Rule 18                   |
| `R1CustomObjectName`    | Custom objects, metadata types and platform events named `R1_<PascalCase>`                       | —         | Error    | IV Rule 6                    |
| `R1CustomFieldName`     | Custom fields named `R1_<PascalCase>__c` (namespaced fields skipped)                             | —         | Error    | IV Rule 7                    |
| `R1ValidationRuleName`  | Validation Rules named `R1_<FieldOrTopic>_<Condition>`                                           | —         | Error    | VI Rule 2                    |
| `R1MetadataPrefix`      | `R1_` prefix on permission sets, custom permissions, record types, apps, tabs and other metadata | —         | Error    | R1_ Prefix Policy, IV Rule 8 |

<!-- rule-reference:end -->

### Not automated

SOLID, intention-revealing names, comments that explain "why", ApexDoc on methods, the Validation Rule bypass,
`System.runAs` scenarios, test scenario quality, idempotent asynchronous jobs, temporary bypasses, coordination
with existing automation, custom label names, and Apex code coverage.

## Running it locally

PMD needs Java and the [PMD 7.22.0 distribution](https://github.com/pmd/pmd/releases/tag/pmd_releases%2F7.22.0).
From a clone of this repo, point `--root` at a checkout of the repo and branch you want to check:

```bash
PMD_BIN=/path/to/pmd node code-standards/scripts/check-pmd.mjs --root ../MyProject --base origin/main
```

```bash
node code-standards/scripts/check-new-files.mjs --root ../MyProject --base origin/main
```

Without `--base`, `check-pmd.mjs` analyzes all of `force-app`.

## Changing the rules

1. Edit `ruleset.xml` or the scripts, and add or update a fixture for every rule you touch: every
   `fixtures/<group>/<Rule>/bad` file must report the rule and no `good` file may.
2. Regenerate the rule reference with `npm run standards:rules` (a new rule also needs an entry
   in `scripts/rules.mjs`: category, what it checks and its section of the Code Conventions).
3. Run the tests (the **Code Standards self-test** workflow also runs them on every pull request, including a check
   that the rule reference is up to date):

   ```bash
   PMD_BIN=/path/to/pmd npm run standards:test
   ```

4. After the change is merged to `main`, release it: tag `v1.x.y` and move the `v1` tag to the same commit. Repos
   pinned to `@v1` get it on their next run. A change that breaks the inputs needs a new major tag (`v2`).

## Suppressing a finding

When splitting the code would make it harder to understand, suppress only the specific rule and explain why in a
comment, as the conventions require. The reviewer approves the exception in the pull request.

```apex
// Maps the 40 fields of the integration payload one by one; splitting it hides the mapping.
@SuppressWarnings('PMD.NcssCount')
public static Account toAccount(Map<String, Object> payload) {
```
