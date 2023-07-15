import * as core from '@actions/core'
import * as github from '@actions/github'
import {inputs} from './inputs'
import {getLatestVersionFromGitTags} from './latest-version'
import {getNextVersion} from './next-version'
import {outputs} from './outputs'
import {printVersion} from './version'

async function run(): Promise<void> {
  try {
    const token = core.getInput(inputs.githubToken)
    let owner = core.getInput(inputs.owner)
    let repo = core.getInput(inputs.repo)

    const prNumber = core.getInput(inputs.pr)
    const majorLabelsInput = core.getInput(inputs.majorLabels)
    const minorLabelsInput = core.getInput(inputs.minorLabels)
    const patchLabelsInput = core.getInput(inputs.patchLabels)
    const nextVersionPrefix = core.getInput(inputs.nextVersionTagPrevix)

    const majorLabels = majorLabelsInput
      ?.split(',')
      .map(x => x?.trim().toLowerCase())
      .filter(Boolean)
    const minorLabels = minorLabelsInput
      ?.split(',')
      .map(x => x?.trim().toLowerCase())
      .filter(Boolean)
    const patchLabels = patchLabelsInput
      ?.split(',')
      .map(x => x?.trim().toLowerCase())
      .filter(Boolean)

    let gitHubRefForPr = github.context.ref

    if (prNumber) {
      // github.ref: refs/pull/<pr_number>/merge
      gitHubRefForPr = `refs/pull/${prNumber}/merge`
    }

    if (!owner) {
      owner = github.context.repo.owner
    }
    if (!repo) {
      repo = github.context.repo.repo
    }

    const latestVersion = await getLatestVersionFromGitTags({
      token,
      owner,
      repo
    })

    const nextVersion = await getNextVersion({
      token,
      owner,
      repo,
      ref: gitHubRefForPr,
      latestVersion,
      majorLabels,
      minorLabels,
      patchLabels
    })

    core.setOutput(
      outputs.latestVersion,
      latestVersion ? printVersion(latestVersion) : ''
    )
    core.setOutput(
      outputs.nextVersion,
      nextVersion ? printVersion(nextVersion, nextVersionPrefix) : ''
    )
    core.setOutput(
      outputs.nextVersionMajor,
      nextVersion ? `${nextVersion.major}` : ''
    )
    core.setOutput(
      outputs.nextVersionMinor,
      nextVersion ? `${nextVersion.minor}` : ''
    )
    core.setOutput(
      outputs.nextVersionPatch,
      nextVersion ? `${nextVersion.patch}` : ''
    )
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
