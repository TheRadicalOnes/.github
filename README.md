# .github

Organization-wide defaults for TheRadicalOnes. GitHub uses these in any repo that doesn't have its own version.

| File | What it does |
|---|---|
| [`.github/pull_request_template.md`](.github/pull_request_template.md) | Default PR template |
| [`.github/workflows/pr-template.yml`](.github/workflows/pr-template.yml) | Reusable workflow that adds the PR template to PRs opened outside the website (Gearset, CLI, IDEs) |
| [`.github/workflows/request-review-slack.yml`](.github/workflows/request-review-slack.yml) | Reusable workflow that posts a PR to #pull-requests in Slack when it has the `needs review` label and isn't a draft |
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

## Adding the Slack review-request workflow to a repo

To post a repo's PRs to #pull-requests when they need a review, add this file to the repo as `.github/workflows/request-review-slack.yml`:

```yaml
name: Request review in Slack

on:
  pull_request:
    types: [labeled, ready_for_review]

jobs:
  notify:
    uses: TheRadicalOnes/.github/.github/workflows/request-review-slack.yml@main
    secrets: inherit
```

It posts when the `needs review` label is added to a non-draft PR, or when a draft that already has the label is marked "Ready for review". Drafts are never posted.

The repo needs a `needs review` label, and the file has to be on every branch that PRs target (`main`, `development`, etc.): the workflow only runs for PRs whose target branch contains it. The Slack webhook comes from the org secret `SLACK_WEBHOOK_URL`.
