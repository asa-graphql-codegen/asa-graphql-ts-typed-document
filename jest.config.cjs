const { resolve } = require("path");

const ROOT_DIR = __dirname;
const CI = !!process.env.CI;

const dirname = __dirname;
const pkg = require(resolve(dirname, "package.json"));
const projectMode = true;

module.exports = {
  ...(CI || !projectMode
    ? {}
    : { displayName: pkg.name.replace("@graphql-codegen/", "") }),
  transform: { "^.+\\.tsx?$": "babel-jest" },
  testEnvironment: "node",
  rootDir: dirname,
  restoreMocks: true,
  reporters: ["default"],
  modulePathIgnorePatterns: ["dist"],
  moduleNameMapper: {
    "(.+)\\.js": "$1",
  },
  cacheDirectory: resolve(ROOT_DIR, `${CI ? "" : "node_modules/"}.cache/jest`),
  setupFiles: [`${ROOT_DIR}/dev-test/setup.js`],
  collectCoverage: false,
  testTimeout: 20000,
  extensionsToTreatAsEsm: [".ts"],
};
