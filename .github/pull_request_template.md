<!--
  Title format: <PROJECT>-<ClickUp ID>: <short description>
  Example: "AMIA-123: Add membership renewal flow"
-->

## Task

- ClickUp: <link>
- Depends on: <!-- PR/task that must land first, or None -->

## Description

<!-- What the task asked for and why, in 1-3 sentences. -->

## Solution

<!-- How you solved it: approach, key changes, anything non-obvious. -->

**Type of change**
- [ ] Feature
- [ ] Bug fix
- [ ] Hotfix
- [ ] Breaking change
- [ ] Config / metadata only

## Testing

<!-- What you ran and where. "Deployed to INT and checked X" beats "tested locally". -->

- Test coverage: <!-- %, or N/A with a reason -->

## Visual proof

<!-- Screenshot, screencast or GIF showing the change working. Required for UI or behavior changes. -->

## Documentation

<!-- Docs, README or Confluence updated? Link it, or write N/A. -->

## Fonteva impact <sub>(check only if it applies)</sub>

- [ ] Events
- [ ] Memberships
- [ ] Orders & Checkout
- [ ] eStore / Catalog
- [ ] Accounting / GL
- [ ] Payments / Gateway
- [ ] Required Fonteva seed data exists in the target sandbox

## Checklist

- [ ] Self-reviewed my code
- [ ] Commented hard-to-understand areas
- [ ] Added or updated tests; new and existing tests pass (Apex ≥ 75%, target 80%+)
- [ ] Linters clean (PMD / Jest, where applicable)
- [ ] No excluded metadata (Profiles, managed-package components, etc.; see `.forceignore`)
- [ ] Visual proof and documentation added above
