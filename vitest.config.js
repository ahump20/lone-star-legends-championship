export default {
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    testMatch: ['**/tests/**/*.test.js'],
  },
};
