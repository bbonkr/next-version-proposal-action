module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    // @actions/* and @octokit/* are ESM-only; transform them to CommonJS
    '^.+\\.js$': ['ts-jest', {tsconfig: {allowJs: true}}]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@actions|@octokit|universal-user-agent|before-after-hook|fast-content-type-parse|json-with-bigint|undici|content-type)/)'
  ],
  resolver: '<rootDir>/jest.resolver.js',
  setupFiles: ['dotenv/config'],
  verbose: true,
  cacheDirectory: '.test'
}
