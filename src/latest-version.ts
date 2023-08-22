import * as core from '@actions/core'
import * as github from '@actions/github'
//import {RequestError} from '@octokit/types' // Unable to resolve path to module '@octokit/types'.eslintimport/no-unresolved
import {Version, parseVersion, printVersion, sortDesc} from './version'
import {RequestError} from './request-error'

interface NextVersionOptions {
  token: string
  owner: string
  repo: string
  versionPrefix?: string
}

/**
 * Get latest version from git tags
 *
 * @param options
 * @returns
 */
export async function getLatestVersionFromGitTags(
  options: NextVersionOptions
): Promise<Version | undefined> {
  const {token, owner, repo, versionPrefix} = options
  let errorMessage = ''

  if (!token) {
    errorMessage = 'Token is required'
    core.warning(errorMessage)
    throw new Error(errorMessage)
  }

  let resultCount = 0
  let gitTags: Version[] = []
  const emptyVersion: Version = {
    major: 0,
    minor: 0,
    patch: 0
  }

  try {
    const octokit = github.getOctokit(token)

    core.debug(`owner=${owner}&repo=${repo}`)
    const {status, data} = await octokit.rest.git.listMatchingRefs({
      owner,
      repo,
      ref: `tags/${versionPrefix ?? ''}`
    })

    resultCount = data.length
    core.debug(
      `getLatestVersionFromGitTags::status: ${status}, count: ${resultCount}`
    )

    const tags = data
      .map(x => {
        if (x.ref.startsWith('refs/tags/')) {
          // ref:= refs/tags/v1.0.0
          const tagName = x.ref.split('/').find((_, index) => index === 2)
          if (tagName) {
            try {
              return parseVersion(tagName)
            } catch {
              return emptyVersion
            }
          } else {
            return emptyVersion
          }
        }
        return emptyVersion
      })
      .filter(Boolean)

    gitTags = [
      ...gitTags,
      ...tags.filter(x => x.major !== 0 && x.minor !== 0 && x.patch !== 0)
    ]

    const latestVersion = gitTags
      .slice()
      .sort(sortDesc)
      .find((_, index) => index === 0)

    if (typeof latestVersion !== 'undefined') {
      core.notice(`Tags found: tag=${printVersion(latestVersion)}.`)
      return latestVersion
    }
    // next version
  } catch (error: unknown) {
    const octokitError = error as RequestError
    if (octokitError) {
      core.debug(`status: ${octokitError.status}, name: ${octokitError.name}`)
      if (octokitError.status === 404) {
        core.notice(`Tags not found.`)
        return undefined
      }
    }

    core.startGroup('Unknown error occurred')
    core.error((error as Error) ?? new Error('error does not Error type'))
    core.endGroup()

    throw error
  }

  core.notice(`Tags not found.`)

  return undefined
}
