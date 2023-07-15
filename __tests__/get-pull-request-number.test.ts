import {describe, expect, test} from '@jest/globals'
import {getPullRequestNumber} from '../src/get-pull-request-number'

describe('getPullRequestNumber', () => {
  test('It should be parse pull request number', () => {
    // github.ref: refs/pull/<pr_number>/merge
    const pr = 116
    const githubPrRef = `refs/pull/${pr}/merge`
    const prNumber = getPullRequestNumber(githubPrRef)

    expect(prNumber).toBe(pr)
  })

  test('It should throw error', () => {
    const pr = 116

    const githubPrRef = `not-pull/${pr}/merge`
    const result = getPullRequestNumber(githubPrRef)

    expect(result).toBe(-1)
  })
})
