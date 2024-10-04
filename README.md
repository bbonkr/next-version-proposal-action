# Next version proposal action

[![View on Marketplace: next-version-proposal-action](https://img.shields.io/badge/Marketplace-next--version--proposal--action-blueviolet)](https://github.com/marketplace/actions/next-version-proposal-action) [![](https://img.shields.io/github/v/release/bbonkr/next-version-proposal-action?display_name=tag&style=flat-square&include_prereleases)](https://github.com/bbonkr/next-version-proposal-action/releases)

Github action which recommends a name for the next version based on your git tag and pull request labels.

## Usages

### Inputs

| Name                | Required | Description                                                                                                |
| :------------------ | :------: | :--------------------------------------------------------------------------------------------------------- |
| github_token        |          | GitHub Personal Access Token. It requires REPO scope. Defaluts to `github.token`                           |
| pr                  |          | Pull request number. Input just number e.g. `100`. Defaults to `github.event.pull_request.number`          |
| major_labels        |          | A comma-separated list of label names to increment the major version by. Defaults to `major,next`          |
| minor_labels        |          | A comma-separated list of label names to increment the minor version by. Defaults to `enhancement,feature` |
| ~~patch_labels~~    |          | ~~A comma-separated list of label names to increment the patch version by.~~                               |
| next_version_prefix |          | Next version prefix                                                                                        |
| logging             |          | Shows log messages. (You want to show log message please set `true`.)                                      |

> [!NOTE]
> We no longer maintain patch labels. If it cannot find a matching label in the major and minor labels, it treats as a patch version increase.

### Outputs

| Name               | Description                               |
| :----------------- | :---------------------------------------- |
| latest_version     | Latest version of git tag                 |
| next_version       | Recommended next version name             |
| next_version_major | Major version of Recommended next version |
| next_version_minor | Minor version of Recommended next version |
| next_version_patch | Patch version of Recommended next version |

- next_version is `1.0.0` if latest version could not find.
- latest_version is latest git tag name of git tags SEMVER[^semver] formatted.

### Example
#### TL;DR
```yaml
      - name: Get next version
        uses: bbonkr/next-version-proposal-action@v1
        id: next_version_proposal

      - name: Use
        run: echo "next_version=${{ steps.next_version_proposal.outputs.next_version }}"
```

#### Full
We recommend using this action in the `pull_request` event, because this action requires PR ref.

You can recognize the PR is closed as completed with condition of `github.event.pull_request.merged == true`.

```yaml
name: 'create-tag'

on:
  pull_request:
    branches:
      - main
    types:
      - closed

jobs:
  next_version:
    runs-on: ubuntu-latest
    if: github.event.pull_request.merged == true # It represents PR is closed as completed
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Get next version
        uses: bbonkr/next-version-proposal-action@v1
        id: next_version_proposal
        with:
          github_token: ${{ github.token }}
          pr: ${{ github.event.pull_request.number }}
          major_labels: 'major,next'
          minor_labels: 'enhancement,feature'
          next_version_prefix: 'v'

      - name: logging
        run: |
          echo "latest_version=${{ steps.next_version_proposal.outputs.latest_version }}"
          echo "next_version=${{ steps.next_version_proposal.outputs.next_version }}"
          echo "next_version_major=${{ steps.next_version_proposal.outputs.next_version_major }}"
          echo "next_version_minor=${{ steps.next_version_proposal.outputs.next_version_minor }}"
          echo "next_version_patch=${{ steps.next_version_proposal.outputs.next_version_patch }}"
```

### References

- https://docs.github.com/en/actions/learn-github-actions/contexts#github-context
- https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request
- https://docs.github.com/en/actions/learn-github-actions/expressions#functions
- https://docs.github.com/en/actions/using-workflows/using-github-cli-in-workflows
- https://docs.github.com/ko/rest/pulls/pulls?apiVersion=2022-11-28#list-pull-requests
- https://docs.github.com/ko/rest/git/refs?apiVersion=2022-11-28#list-matching-references

[^semver]: https://semver.org/
