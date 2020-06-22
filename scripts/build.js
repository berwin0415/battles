const rollup = require('rollup')
const path = require('path')
const fs = require('fs')
const babel = require('@rollup/plugin-babel')
const resolve = require('@rollup/plugin-node-resolve')
const { exec } = require('./utils/child-process-promise')
const PACKAGES_PATH = path.resolve(__dirname, '../packages')
function getPackages() {
  return fs
    .readdirSync(PACKAGES_PATH)
    .map((item) => ({
      path: path.resolve(PACKAGES_PATH, item),
      packageName: item,
    }))
    .filter((item) => fs.statSync(item.path).isDirectory())
}

function resolveEntry(bundlePath) {
  return path.resolve(bundlePath, 'src/index.js')
}

function getBundleOutputPath(packageName) {
  return `packages/${packageName}/lib/index.cjs.js`
}

function getBundleOutput(bundle) {
  return {
    file: getBundleOutputPath(bundle.packageName),
    format: 'cjs',
  }
}

function getPlugins(bundle) {
  return [
    resolve.default(),
    babel.default(getBabelConfig({ babelHelpers: 'bundled' })),
  ]
}

function getBabelConfig(configs) {
  return Object.assign(
    {
      exclude: '/**/node_modules/**',
      babelrc: false,
      configFile: false,
      plugins: [
        [
          '@babel/plugin-proposal-object-rest-spread',
          { loose: true, useBuiltIns: true },
        ],
        '@babel/plugin-transform-parameters',
        ['@babel/plugin-transform-spread', { loose: true, useBuiltIns: true }],
      ],
    },

    configs
  )
}
async function createBundles(bundle) {
  const inputOptions = {
    input: resolveEntry(bundle.path),
    plugins: getPlugins(bundle),
  }
  const outputOptions = getBundleOutput(bundle)
  const result = await rollup.rollup(inputOptions)
  // or write the bundle to disk
  await result.write(outputOptions)
}

async function runBuild() {
  const bundles = getPackages()
  for (const bundle of bundles) {
    try {
      console.log('start build bundles', bundle)
      await createBundles(bundle)
      console.log('success build bundles', bundle)
    } catch (error) {
      console.log('failed build bundles', bundle)
    }
  }
}
runBuild()
