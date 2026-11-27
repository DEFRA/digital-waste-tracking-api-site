// Module hooks for run.js: anything that imports the backend's
// src/schemas/validate/index.js gets a module in its place that re-exports it,
// with validate() also reporting each payload it accepts to
// globalThis.recordExample(schemaId, payload).

const VALIDATE = /\/src\/schemas\/validate\/index\.js$/
const SHIM = 'schema-explorer-validate:'

export const resolve = async (specifier, context, next) => {
  if (specifier.startsWith(SHIM)) return { url: specifier, shortCircuit: true }
  const resolved = await next(specifier, context)
  return VALIDATE.test(resolved.url) && !context.parentURL?.startsWith(SHIM)
    ? { url: SHIM + resolved.url, shortCircuit: true }
    : resolved
}

export const load = async (url, context, next) => {
  if (!url.startsWith(SHIM)) return next(url, context)
  const real = JSON.stringify(url.slice(SHIM.length))
  return {
    format: 'module',
    shortCircuit: true,
    source: `import * as real from ${real}
export * from ${real}
export const validate = (schemaId, payload) => {
  const valid = real.validate(schemaId, payload)
  if (valid) globalThis.recordExample?.(schemaId, payload)
  return valid
}
`
  }
}
