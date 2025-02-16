const getVersionMessage = async (releasePlan) => {
  const publishableReleases = releasePlan.releases.filter(
    (release) => release.type !== 'none',
  )

  const newVersion = publishableReleases[0].newVersion

  return `v${newVersion}`
}

module.exports = { getVersionMessage }
