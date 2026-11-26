// Bundles legacy/check.js, with Joi, the route schemas and the utils schemas,
// into one script for the legacy page's "Try it" view (window.legacyCheck).
//
// The route schemas are bundled as they are, with two imports pointed
// somewhere a browser can run:
// - '@defra/waste-movement-utils': the package's index also exports test
//   helpers (Mongo, uuid…), so only the modules these routes use are bundled.
// - src/config.js (convict, process.env): replaced by the values it has when
//   the page is built, e.g. bulk.recordLimit.
// - the utils EWC code list: swapped for the codes alone (../ewc-codes.js).
// - legacy/schemas.js, which finds the schemas by importing the route modules:
//   replaced by a module that imports the schemas it found directly.

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { ewcCodesPlugin } from '../ewc-codes.js'
import { config } from '../../../src/config.js'
import { browserModule } from './schemas.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const utilsSrc = path.resolve(
  here,
  '../../../node_modules/@defra/waste-movement-utils/src'
)
const configFile = path.resolve(here, '../../../src/config.js')
const schemasFile = path.join(here, 'schemas.js')

// What the bundled code imports from the utils package index.
const UTILS_EXPORTS = {
  'schemas/receipt.js': ['receiveMovementRequestSchema'],
  'helpers/validation-error-formatter.js': ['validationErrorFormatter'],
  'constants/http-status-codes.js': ['HTTP_STATUS']
}
// The config the bundled code reads.
const CONFIG_KEYS = ['bulk.recordLimit']

const shimsFor = (fragmentFiles) => ({
  name: 'legacy-shims',
  setup(b) {
    b.onLoad({ filter: /[\\/]legacy[\\/]schemas\.js$/ }, (args) =>
      path.resolve(args.path) === schemasFile
        ? {
            contents: browserModule(fragmentFiles),
            resolveDir: here,
            loader: 'js'
          }
        : undefined
    )
    b.onResolve({ filter: /^@defra\/waste-movement-utils$/ }, () => ({
      path: 'utils',
      namespace: 'shim'
    }))
    b.onResolve({ filter: /config\.js$/ }, (args) =>
      path.resolve(args.resolveDir, args.path) === configFile
        ? { path: 'config', namespace: 'shim' }
        : undefined
    )
    b.onLoad({ filter: /^utils$/, namespace: 'shim' }, () => ({
      contents: Object.entries(UTILS_EXPORTS)
        .map(
          ([file, names]) =>
            `export { ${names.join(', ')} } from ${JSON.stringify(path.join(utilsSrc, file))}`
        )
        .join('\n'),
      resolveDir: utilsSrc,
      loader: 'js'
    }))
    b.onLoad({ filter: /^config$/, namespace: 'shim' }, () => {
      const values = Object.fromEntries(
        CONFIG_KEYS.map((key) => [key, config.get(key)])
      )
      return {
        contents: `const values = ${JSON.stringify(values)}
export const config = {
  get (key) {
    if (!(key in values)) throw new Error('Not in the legacy explorer bundle: config ' + key)
    return values[key]
  }
}`,
        loader: 'js'
      }
    })
  }
})

/**
 * @param {string[]} [fragmentFiles] the fragments the page shows (default all)
 * @returns {Promise<string>} a script that defines window.legacyCheck(key, payload)
 */
export const buildLegacyBundle = async (fragmentFiles) => {
  const result = await build({
    entryPoints: [path.join(here, 'check.js')],
    bundle: true,
    write: false,
    format: 'iife',
    globalName: 'legacyExplorer',
    platform: 'browser',
    target: 'es2020',
    minify: true,
    legalComments: 'none',
    plugins: [shimsFor(fragmentFiles), ewcCodesPlugin],
    logLevel: 'silent'
  })
  return `${result.outputFiles[0].text}\nwindow.legacyCheck = legacyExplorer.check`
}
