module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleFileExtensions: ['js', 'jsx'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    // CSS modules and files
    '^.+\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Static assets to a stub
    '^.+\\.(jpg|jpeg|png|gif|svg|webp|ico|bmp|ttf|woff2?)$': '<rootDir>/test-file-stub.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '/rules-tests/'],
};
