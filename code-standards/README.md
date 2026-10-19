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

| Rule                             | Checks                                      | Threshold                                  | Severity |
| -------------------------------- | ------------------------------------------- | ------------------------------------------ | -------- |
| `CyclomaticComplexity`           | Independent paths through a method or class | ≥11 per method, ≥81 per class              | Error    |
| `CyclomaticComplexityTarget`     | Independent paths through a method or class | ≥8 per method, ≥41 per class               | Warning  |
| `CognitiveComplexity`            | How hard a method is to understand          | ≥16 per method                             | Error    |
| `CognitiveComplexityTarget`      | How hard a method is to understand          | ≥11 per method                             | Warning  |
| `NcssCount`                      | Lines of code of a method or class          | ≥51 lines per method, ≥501 lines per class | Error    |
| `NcssCountTarget`                | Lines of code of a method or class          | ≥31 lines per method, ≥301 lines per class | Warning  |
| `NcssCountTestClass`             | Lines of code of a test class               | ≥1001 lines per test class                 | Error    |
| `NcssCountTestClassTarget`       | Lines of code of a test class               | ≥501 lines per test class                  | Warning  |
| `ExcessiveParameterList`         | Parameters per method                       | ≥5 parameters                              | Error    |
| `ExcessiveParameterListTarget`   | Parameters per method                       | ≥4 parameters                              | Warning  |
| `TooManyFields`                  | Fields per class                            | ≥16 fields                                 | Error    |
| `TooManyFieldsTarget`            | Fields per class                            | ≥11 fields                                 | Warning  |
| `AvoidDeeplyNestedIfStmts`       | Nesting depth of if statements              | 4 or more levels                           | Error    |
| `AvoidDeeplyNestedIfStmtsTarget` | Nesting depth of if statements              | 3 or more levels                           | Warning  |
| `R1TooManyMethods`               | Methods per class (constructors excluded)   | ≥26 methods                                | Error    |
| `R1TooManyMethodsTarget`         | Methods per class (constructors excluded)   | ≥16 methods                                | Warning  |

#### Readability and dead code

| Rule                          | Checks                                 | Threshold | Severity |
| ----------------------------- | -------------------------------------- | --------- | -------- |
| `IfStmtsMustUseBraces`        | `if` without braces                    | —         | Error    |
| `IfElseStmtsMustUseBraces`    | `if`/`else` without braces             | —         | Error    |
| `ForLoopsMustUseBraces`       | `for` without braces                   | —         | Error    |
| `WhileLoopsMustUseBraces`     | `while` without braces                 | —         | Error    |
| `OneDeclarationPerLine`       | Several variables declared on one line | —         | Warning  |
| `UnusedLocalVariable`         | Local variables that are never used    | —         | Error    |
| `UnusedMethod`                | Private methods that are never called  | —         | Warning  |
| `EmptyIfStmt`                 | Empty `if` blocks                      | —         | Error    |
| `EmptyWhileStmt`              | Empty `while` blocks                   | —         | Error    |
| `EmptyTryOrFinallyBlock`      | Empty `try` or `finally` blocks        | —         | Error    |
| `EmptyStatementBlock`         | Other empty blocks                     | —         | Warning  |
| `DebugsShouldUseLoggingLevel` | `System.debug` without a logging level | —         | Warning  |

#### Triggers

| Rule                          | Checks                                                                           | Threshold | Severity |
| ----------------------------- | -------------------------------------------------------------------------------- | --------- | -------- |
| `AvoidLogicInTrigger`         | Logic inside the trigger instead of its handler                                  | —         | Error    |
| `AvoidDirectAccessTriggerMap` | Direct access such as `Trigger.new[0]`                                           | —         | Error    |
| `R1HandlerExtendsBase`        | Handlers not extending `R1_TriggerHandler` (managed-package frameworks excluded) | —         | Warning  |

#### Security

| Rule                        | Checks                                                                   | Threshold | Severity |
| --------------------------- | ------------------------------------------------------------------------ | --------- | -------- |
| `ApexSharingViolations`     | Classes with SOQL/DML and no sharing declaration                         | —         | Error    |
| `ApexCRUDViolation`         | SOQL/DML without CRUD/FLS checks or user mode (custom metadata excluded) | —         | Error    |
| `ApexSOQLInjection`         | Dynamic SOQL built from unescaped input                                  | —         | Error    |
| `ApexSuggestUsingNamedCred` | Callouts with hardcoded credentials                                      | —         | Error    |
| `ApexInsecureEndpoint`      | Callouts to `http://` endpoints                                          | —         | Error    |
| `ApexCSRF`                  | DML in constructors or init methods                                      | —         | Error    |
| `AvoidHardcodingId`         | Hardcoded record Ids (test classes excluded)                             | —         | Error    |

#### Queries, DML and asynchronous Apex

| Rule                          | Checks                                                      | Threshold | Severity |
| ----------------------------- | ----------------------------------------------------------- | --------- | -------- |
| `OperationWithLimitsInLoop`   | SOQL, DML and other limited operations inside loops         | —         | Error    |
| `OperationWithHighCostInLoop` | Expensive calls (describe, JSON...) inside loops            | —         | Warning  |
| `AvoidNonRestrictiveQueries`  | Queries without `WHERE` or `LIMIT`                          | —         | Warning  |
| `R1SoqlOnlyInSelector`        | Queries outside `*Selector` classes (test classes excluded) | —         | Warning  |
| `AvoidFutureAnnotation`       | `@future` instead of Queueable                              | —         | Warning  |
| `QueueableWithoutFinalizer`   | Queueable jobs without a finalizer                          | —         | Warning  |
| `AvoidGlobalModifier`         | `global` where `public` would do                            | —         | Warning  |

#### Error handling

| Rule                        | Checks                                             | Threshold | Severity |
| --------------------------- | -------------------------------------------------- | --------- | -------- |
| `EmptyCatchBlock`           | Empty `catch` blocks                               | —         | Error    |
| `R1AuraExceptionSetMessage` | `AuraHandledException` thrown without `setMessage` | —         | Warning  |

#### Tests

| Rule                                           | Checks                                                    | Threshold | Severity |
| ---------------------------------------------- | --------------------------------------------------------- | --------- | -------- |
| `ApexUnitTestClassShouldHaveAsserts`           | Test methods without assertions (`assert…` helpers count) | —         | Error    |
| `ApexAssertionsShouldIncludeMessage`           | Assertions without a message                              | —         | Error    |
| `ApexUnitTestShouldNotUseSeeAllDataTrue`       | `SeeAllData=true`                                         | —         | Error    |
| `ApexUnitTestMethodShouldHaveIsTestAnnotation` | Test methods without `@IsTest`                            | —         | Error    |
| `TestMethodsMustBeInTestClasses`               | Test methods outside test classes                         | —         | Warning  |
| `R1UseAssertClass`                             | `System.assert*` instead of the `Assert` class            | —         | Warning  |

#### Naming

| Rule                                 | Checks                                                                     | Threshold | Severity |
| ------------------------------------ | -------------------------------------------------------------------------- | --------- | -------- |
| `ClassNamingConventions`             | Class names in Pascal Case                                                 | —         | Warning  |
| `MethodNamingConventions`            | Method names in camel Case; test methods `should…_When…` or `should…When…` | —         | Warning  |
| `FieldNamingConventions`             | Field names; constants in `SNAKE_CASE`                                     | —         | Warning  |
| `FormalParameterNamingConventions`   | Parameter names in camel Case                                              | —         | Warning  |
| `LocalVariableNamingConventions`     | Local variable names in camel Case                                         | —         | Warning  |
| `PropertyNamingConventions`          | Property names in camel Case                                               | —         | Warning  |
| `MethodWithSameNameAsEnclosingClass` | Methods named like their class                                             | —         | Warning  |
| `AvoidNonExistentAnnotations`        | Annotations that do not exist                                              | —         | Warning  |
| `R1InterfaceNaming`                  | Top-level interfaces named `R1_I…`                                         | —         | Warning  |
| `R1EnumNaming`                       | Top-level enums named `R1_…`                                               | —         | Warning  |

#### Comments

| Rule             | Checks                                                       | Threshold | Severity |
| ---------------- | ------------------------------------------------------------ | --------- | -------- |
| `ApexDoc`        | ApexDoc header on every class (method comments are optional) | —         | Error    |
| `R1NoAuthorTags` | `@author`, `@date`, `@company` or `@changes` in ApexDoc      | —         | Warning  |

#### Flows

| Rule                         | Checks                                                                              | Threshold    | Severity |
| ---------------------------- | ----------------------------------------------------------------------------------- | ------------ | -------- |
| `R1FlowMissingFaultPath`     | Get/Create/Update/Delete Records and Action elements without a fault path           | —            | Warning  |
| `R1FlowMissingDescription`   | Flows without a description                                                         | —            | Warning  |
| `R1FlowMissingEntryCriteria` | Record-triggered Flows without entry conditions                                     | —            | Warning  |
| `R1FlowBypassPermission`     | Record-triggered Flows without `$Permission.R1_BypassTriggers` in the entry formula | —            | Warning  |
| `R1FlowTooManyElements`      | Elements per Flow                                                                   | ≥51 elements | Error    |
| `R1FlowDbInLoop`             | Get/Create/Update/Delete Records inside a loop                                      | —            | Warning  |
| `R1FlowResourceNaming`       | Resource prefixes (`varB_`, `forN_`, `con_`, `textT_`…)                             | —            | Warning  |
| `R1HardcodedIdInMetadata`    | Hardcoded record Ids in Flow values and formulas, and in Validation Rule formulas   | —            | Error    |

#### Validation Rules

| Rule                                 | Checks                                                            | Threshold | Severity |
| ------------------------------------ | ----------------------------------------------------------------- | --------- | -------- |
| `R1ValidationRuleMissingDescription` | Validation Rules without a description                            | —         | Warning  |
| `R1ValidationRuleErrorLocation`      | Error shown at the top of the page when the rule checks one field | —         | Warning  |

#### Custom fields

| Rule                        | Checks                                                                      | Threshold | Severity |
| --------------------------- | --------------------------------------------------------------------------- | --------- | -------- |
| `R1FieldMissingDescription` | Custom fields without a description                                         | —         | Warning  |
| `R1FieldBooleanNaming`      | Checkbox fields not starting with `Is`, `Has` or `Can`                      | —         | Warning  |
| `R1FieldDateNaming`         | Date fields not ending in `Date`, Date/Time fields not ending in `DateTime` | —         | Warning  |
| `R1FieldLookupNaming`       | Lookup and master-detail fields ending in `Id`                              | —         | Warning  |

#### New files

| Rule                    | Checks                                                                                           | Threshold | Severity |
| ----------------------- | ------------------------------------------------------------------------------------------------ | --------- | -------- |
| `R1ApexClassName`       | Apex classes named `R1_<PascalCase>`                                                             | —         | Error    |
| `R1TestClassSuffix`     | Test classes end with `_Test` (`Factory`/`Mock` for test support); only test classes do          | —         | Error    |
| `R1TriggerName`         | Triggers named `R1_<Object>Trigger`                                                              | —         | Error    |
| `R1OneTriggerPerObject` | A second trigger on the same object                                                              | —         | Error    |
| `R1FlowName`            | Flow API names starting with `R1_`                                                               | —         | Error    |
| `R1FlowLabel`           | Flow labels following the pattern of their type (`Record-Trigger: <Object> After Save`…)         | —         | Error    |
| `R1FlowApiName`         | Flow API name equal to `R1_` + label                                                             | —         | Warning  |
| `R1LwcName`             | LWC folders named `r1_<camelCase>`, without `Cmp`                                                | —         | Error    |
| `R1AuraName`            | Aura bundles `R1_<PascalCase>`, events `R1_<Name>Evt`                                            | —         | Error    |
| `R1VisualforceName`     | Visualforce pages `R1_<PascalCase>`, components `R1_<PascalCase>Cmp`                             | —         | Error    |
| `R1CustomObjectName`    | Custom objects, metadata types and platform events named `R1_<PascalCase>`                       | —         | Error    |
| `R1CustomFieldName`     | Custom fields named `R1_<PascalCase>__c` (namespaced fields skipped)                             | —         | Error    |
| `R1ValidationRuleName`  | Validation Rules named `R1_<FieldOrTopic>_<Condition>`                                           | —         | Error    |
| `R1MetadataPrefix`      | `R1_` prefix on permission sets, custom permissions, record types, apps, tabs and other metadata | —         | Error    |

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
2. Regenerate the rule reference with `npm run standards:rules` (a new rule also needs its category and
   description in `scripts/rule-reference.mjs`).
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
