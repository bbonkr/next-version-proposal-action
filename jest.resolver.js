// @actions/* and @octokit/* are ESM-only and expose only the 'import' export
// condition. Retry with that condition when the default resolution fails.
module.exports = (request, options) => {
  try {
    return options.defaultResolver(request, options)
  } catch (error) {
    return options.defaultResolver(request, {
      ...options,
      conditions: [...(options.conditions ?? []), 'import']
    })
  }
}
