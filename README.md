# .github

Organization-wide defaults for TheRadicalOnes. GitHub uses these in any repo that doesn't have its own version.

| File | What it does |
|---|---|
| [`.github/pull_request_template.md`](.github/pull_request_template.md) | Default PR template |
| [`.github/workflows/pr-template.yml`](.github/workflows/pr-template.yml) | Reusable workflow that adds the PR template to PRs opened outside the website (Gearset, CLI, IDEs) |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Default contributing guide: PR conventions, and where to find each project's branch and release rules |

Edit a file here and it changes for every repo that uses the default.

Project-specific rules (branching, release strategy) belong in that repo's own `CONTRIBUTING.md`, which overrides the default.

## Adding the PR template workflow to a repo

GitHub only pre-fills the template on the website. To also cover PRs opened from Gearset, the CLI or an IDE, add this file to the repo as `.github/workflows/pr-template.yml`:

```yaml
name: PR template

on:
  pull_request:
    types: [opened]

jobs:
  fill:
    uses: TheRadicalOnes/.github/.github/workflows/pr-template.yml@main
    permissions:
      pull-requests: write
```

It skips Gearset promotion PRs (`gs-pipeline/*`), bots, PRs that already have the template, and any PR whose description contains `<!-- skip-pr-template -->`.
