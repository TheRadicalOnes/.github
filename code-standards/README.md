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

### PMD (`ruleset.xml`)

| Area                   | Errors                                                                                                                                                                           | Warnings                                                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Metrics (limit/target) | Cyclomatic complexity ≥11 per method / ≥81 per class, cognitive ≥16, NCSS ≥51 per method / ≥501 per class (≥1001 test class), ≥5 parameters, ≥16 fields, nesting ≥4, ≥26 methods | The `…Target` copies: cyclomatic ≥8/≥41, cognitive ≥11, NCSS ≥31/≥301 (≥501 test class), ≥4 parameters, ≥11 fields, nesting ≥3, ≥16 methods             |
| Readability            | Braces on every block, unused local variables, empty if/while/try blocks                                                                                                         | One declaration per line, unused methods, empty blocks, debug without logging level                                                                     |
| Triggers               | Logic in triggers, direct `Trigger.new[0]` access, SOQL/DML in loops                                                                                                             | High-cost operations in loops, handler not extending `R1_TriggerHandler`                                                                                |
| Apex                   | Sharing declaration, CRUD/FLS (`USER_MODE`), SOQL injection, named credentials, insecure endpoints, CSRF, hardcoded Ids, empty catch                                             | SOQL outside `*Selector`, non-selective queries, `AuraHandledException` without `setMessage`, `@future`, Queueable without finalizer, `global`          |
| Tests                  | Assertions (helpers named `assert…` count), assertion messages, `SeeAllData`, `@IsTest` on test methods                                                                          | `System.assert*` instead of `Assert`, test methods outside test classes                                                                                 |
| Naming                 |                                                                                                                                                                                  | Class, method, field, variable and property naming; test methods `should…_When…` or `should…When…`; interfaces `R1_I…`; enums `R1_…`                    |
| Comments               | ApexDoc header on every class (methods are optional)                                                                                                                             | `@author`, `@date`, `@company`, `@changes` tags                                                                                                         |
| Flows                  | More than 50 elements, hardcoded Ids                                                                                                                                             | Missing fault path (Get/Create/Update/Delete Records, Action), description, entry criteria or `R1_BypassTriggers`; Get/DML in a loop; resource prefixes |
| Validation Rules       | Hardcoded Ids                                                                                                                                                                    | Missing description, error not shown on the single field it checks                                                                                      |
| Custom fields          |                                                                                                                                                                                  | Missing description, Checkbox not `Is/Has/Can…`, Date not `…Date`, Date/Time not `…DateTime`, lookup ending in `Id`                                     |

### New files (`scripts/check-new-files.mjs`)

All errors, except the Flow API name check, which is a warning.

| Component                                                                                                                                       | Convention                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Apex class                                                                                                                                      | `R1_<PascalCase>`; test classes end with `_Test` (or `Factory`/`Mock`) |
| Trigger                                                                                                                                         | `R1_<Object>Trigger`, one trigger per object                           |
| LWC                                                                                                                                             | `r1_<camelCase>`, no `Cmp` suffix                                      |
| Aura                                                                                                                                            | `R1_<PascalCase>`; events `R1_<Name>Evt`                               |
| Visualforce                                                                                                                                     | Pages `R1_<PascalCase>`; components `R1_<PascalCase>Cmp`               |
| Custom objects and fields                                                                                                                       | `R1_<PascalCase>__c` (`__mdt`, `__e`); namespaced names are skipped    |
| Validation Rule                                                                                                                                 | `R1_<FieldOrTopic>_<Condition>`                                        |
| Flow                                                                                                                                            | `R1_` API name, label pattern per Flow type, API name = `R1_` + label  |
| Permission sets and groups, custom permissions, record types, Lightning pages, apps, tabs, static resources, named credentials, email templates | `R1_` prefix                                                           |

Package directories and the namespace come from the repo's `sfdx-project.json` (without it: `force-app`, no
namespace). When the project has a namespace, the namespace replaces the prefix and no naming check runs.

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
2. Run the tests (the **Code Standards self-test** workflow also runs them on every pull request):

   ```bash
   PMD_BIN=/path/to/pmd npm run standards:test
   ```

3. After the change is merged to `main`, release it: tag `v1.x.y` and move the `v1` tag to the same commit. Repos
   pinned to `@v1` get it on their next run. A change that breaks the inputs needs a new major tag (`v2`).

## Suppressing a finding

When splitting the code would make it harder to understand, suppress only the specific rule and explain why in a
comment, as the conventions require. The reviewer approves the exception in the pull request.

```apex
// Maps the 40 fields of the integration payload one by one; splitting it hides the mapping.
@SuppressWarnings('PMD.NcssCount')
public static Account toAccount(Map<String, Object> payload) {
```
