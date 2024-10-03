import * as core from '@actions/core'
import * as github from '@actions/github'
// import {RequestError} from '@octokit/types' // Unable to resolve path to module '@octokit/types'.eslintimport/no-unresolved
import {Version, parseVersion, printVersion, sortDesc} from './version'
import {RequestError} from './request-error'

interface NextVersionOptions {
  token: string
  owner: string
  repo: string
  versionPrefix?: string
  logging?: boolean
}

type Ref = {
  name: string
}
type Node<TNode> = TNode[]

type RefNode = {
  nodes?: Node<Ref>
}

type Repository = {
  refs?: RefNode
}

type ResultData = {
  repository: Repository
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
  const {token, owner, repo, versionPrefix, logging} = options
  let errorMessage = ''

  if (!token) {
    errorMessage = 'Token is required'
    core.warning(errorMessage)
    throw new Error(errorMessage)
  }

  // let resultCount = 0
  const gitTags: Version[] = []
  const emptyVersion: Version = {
    major: 0,
    minor: 0,
    patch: 0
  }

  try {
    const octokit = github.getOctokit(token)

    const {repository} = await octokit.graphql<ResultData>(
      `query getTags($owner: String!, $repo: String!, $prefix: String!) {
  repository(owner: $owner, name: $repo) {
    refs(
      refPrefix: "refs/tags/"
      first: 100
      query: $prefix
      orderBy: {field: TAG_COMMIT_DATE, direction: DESC}
    ) {
      nodes {
        name
      }
    }
  }
}`,
      {
        owner,
        repo,
        prefix: versionPrefix ?? ''
      }
    )

    let parsedVersion: Version

    if (
      !repository?.refs?.nodes ||
      (repository?.refs?.nodes ?? []).length === 0
    ) {
      const notFoundError: RequestError = {
        name: 'Tags not found',
        status: 404,
        documentation_url: ''
      }

      throw notFoundError
    }

    for (const ref of repository?.refs?.nodes ?? []) {
      try {
        parsedVersion = parseVersion(ref.name)

        gitTags.push(parsedVersion)
      } catch {
        parsedVersion = emptyVersion
      }
    }

    const latestVersion = gitTags
      .slice()
      .sort(sortDesc)
      .find((_, index) => index === 0)

    if (typeof latestVersion !== 'undefined') {
      if (logging) {
        core.notice(`Tags found: tag=${printVersion(latestVersion)}.`)
      }
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

  if (logging) {
    core.notice(`Tags not found.`)
  }

  return undefined
}
