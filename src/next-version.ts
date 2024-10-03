import * as core from '@actions/core'
import * as github from '@actions/github'
// import {RequestError} from '@octokit/types' // Unable to resolve path to module '@octokit/types'.eslintimport/no-unresolved
import {getPullRequestNumber} from './get-pull-request-number'
import {Version} from './version'
import {RequestError} from './request-error'

interface NextVersionOptions {
  token: string
  owner: string
  repo: string
  /**
   * github.ref
   *
   * github.ref of GitHub context
   */
  ref: string
  latestVersion: Version | undefined
  majorLabels: string[]
  minorLabels: string[]

  logging?: boolean
}

const containsInTargets = (
  sourceLabels: (string | undefined)[],
  targetLabels: (string | undefined)[]
): boolean => {
  let result = false

  for (const label of sourceLabels) {
    if (label && targetLabels.includes(label)) {
      result = true
      break
    }
  }
  return result
}

export async function getNextVersion(
  options: NextVersionOptions
): Promise<Version | undefined> {
  const {
    token,
    owner,
    repo,
    ref,
    majorLabels,
    minorLabels,
    latestVersion,
    logging
  } = options
  let errorMessage = ''

  if (!token) {
    errorMessage = 'Token is required'
    core.warning(errorMessage)
    throw new Error(errorMessage)
  }

  const prNumber = getPullRequestNumber(ref)

  try {
    const octokit = github.getOctokit(token)

    if (!latestVersion) {
      if (logging) {
        core.notice(
          'Latest version not found. next version is good to be 1.0.0 ❤️'
        )
      }
      return {
        major: 1,
        minor: 0,
        patch: 0
      }
    }

    if (prNumber > 0) {
      const {status, data} = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber
      })

      if (logging) {
        core.debug(`status: ${status}, ref: ${data.number}, url: ${data.url}`)
      }

      const labels = data.labels
        .filter(label => Boolean(label.name))
        .map(label => label.name)

      let nextVersion: Version | undefined

      if (containsInTargets(labels, majorLabels)) {
        nextVersion = {
          major: latestVersion.major + 1,
          minor: 0,
          patch: 0
        }
      } else if (containsInTargets(labels, minorLabels)) {
        nextVersion = {
          ...latestVersion,
          minor: latestVersion.minor + 1,
          patch: 0
        }
      } else {
        nextVersion = {
          ...latestVersion,
          patch: latestVersion.patch + 1
        }
      }

      return nextVersion
    }

    // next version
  } catch (error: unknown) {
    const octokitError = error as RequestError
    if (octokitError) {
      core?.debug(`status: ${octokitError.status}, name: ${octokitError.name}`)
      if (octokitError.status === 404) {
        core.notice(`PR not found. pr=${prNumber}.`)
        return undefined
      }
    }

    core.startGroup('Unknown error occurred')
    core.error((error as Error) ?? new Error('error does not Error type'))
    core.endGroup()

    throw error
  }

  if (logging) {
    core.notice(`PR not found. pr=${prNumber}.`)
  }

  return undefined
}
