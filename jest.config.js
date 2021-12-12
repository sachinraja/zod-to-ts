const jestConfig = {
  transformIgnorePatterns: ['node_modules', 'dist'],
  transform: {
    '^.+\\.(j|t)sx?$': [
      '@swc/jest',
      {
        sourceMaps: true,
        jsc: {
          parser: {
            syntax: 'typescript',
          },
        },
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
}

export default jestConfig
