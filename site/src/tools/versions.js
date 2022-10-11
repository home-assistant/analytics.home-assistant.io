const aNewerThanB = (a, b) => {
  const [aMajor, aMinor] = a.split(".", 2).map((entry) => Number(entry));
  const [bMajor, bMinor] = b.split(".", 2).map((entry) => Number(entry));
  return aMajor > bMajor || (aMajor === bMajor && aMinor > bMinor);
};

const sortedVersions = (data, sortByName) => {
  const versions = {};

  for (const [version, count] of Object.entries(data)) {
    if (version.includes("dev") && count < 100) {
      continue;
    }
    const majorMin = version.split(".", 2).join(".");
    if (!versions[majorMin]) {
      versions[majorMin] = count;
      continue;
    }
    versions[majorMin] += count;
  }

  const entries = Object.entries(versions);
  return {
    ...entries
      .sort(([aName, aValue], [bName, bValue]) =>
        sortByName ? (aNewerThanB(aName, bName) ? -1 : 1) : bValue - aValue
      )
      .slice(0, 5)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {}),
    Other: entries
      .slice(5)
      .reduce(
        (accumulator, [version, _]) => accumulator + versions[version],
        0
      ),
  };
};

module.exports = { sortedVersions };
