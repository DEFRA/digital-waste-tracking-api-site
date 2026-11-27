// The legacy (Joi) schemas the explorer shows, found in the backend rather than
// listed here:
// - roots: the payloads of the legacy (ReceiptOfWaste) routes: every route
//   exported from src/routes/*.js (not the beta-N folders) whose path ends in
//   /receive and whose payload is a Joi schema. Routes with the same schema
//   share a root, named after its export in src/schemas/*.js. Routes on
//   /bulk/ paths report errors per item, as src/plugins/error-handler.js does.
// - fragments: every Joi schema @defra/waste-movement-utils exports from
//   src/schemas/. legacy/joi-model.js shows those the roots are built from.
//
// The generator, and the tests, import this in Node. The legacy page's
// "Try it" bundle (legacy/bundle.js) gets a module in its place that imports
// the same schemas directly (browserModule below), since a browser can't
// import the route modules.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import Joi from 'joi'

const here = path.dirname(fileURLToPath(import.meta.url))
const backend = path.resolve(here, '../../..')
const UTILS = '@defra/waste-movement-utils/src/schemas'

const modulesIn = (dir) =>
  fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.js') && !f.endsWith('.test.js'))
    .sort()
    .map((f) => path.join(dir, f))

/** Every Joi schema a folder's modules export, with where it's from. */
const joiExportsIn = async (dir, label) => {
  const found = []
  for (const module of modulesIn(dir)) {
    const exports = await import(pathToFileURL(module).href)
    for (const [name, schema] of Object.entries(exports)) {
      if (Joi.isSchema(schema)) {
        found.push({
          module,
          name,
          file: `${label}/${path.basename(module)}#${name}`,
          schema
        })
      }
    }
  }
  return found
}

const kebab = (name) =>
  name
    .replace(/Schema$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()

const named = await joiExportsIn(
  path.join(backend, 'src/schemas'),
  'src/schemas'
)

// The legacy routes, in their modules' order, each with its payload schema.
const routes = []
for (const module of modulesIn(path.join(backend, 'src/routes'))) {
  const exports = await import(pathToFileURL(module).href)
  for (const [name, value] of Object.entries(exports)) {
    for (const route of [value].flat()) {
      const payload = route?.options?.validate?.payload
      if (route?.path?.endsWith('/receive') && Joi.isSchema(payload)) {
        routes.push({ module, name, route, schema: payload })
      }
    }
  }
}

// One root per payload schema.
const bySchema = new Map()
for (const r of routes) {
  if (!bySchema.has(r.schema)) bySchema.set(r.schema, [])
  bySchema.get(r.schema).push(r)
}

const describeRoutes = (rs) => {
  const methods = new Map()
  for (const { route } of rs) {
    if (!methods.has(route.path)) methods.set(route.path, [])
    methods
      .get(route.path)
      .push(...[route.method].flat().map((m) => m.toUpperCase()))
  }
  const each = [...methods].map(([p, ms]) => `${ms.join(' and ')} ${p}`)
  return `Payload for ${each.join('; ')}.`
}

/** Each root, as the explorer shows it, and where its schema is exported. */
export const roots = [...bySchema].map(([schema, rs]) => {
  // A schema defined in the route itself is named after the route's export.
  const source = named.find((n) => n.schema === schema) ?? {
    module: rs[0].module,
    name: rs[0].name,
    file: `src/routes/${path.basename(rs[0].module)}#${rs[0].name}`,
    inRoute: true
  }
  return {
    id: kebab(source.name),
    title: source.name,
    file: source.file,
    description: describeRoutes(rs),
    schema,
    bulk: rs.some(({ route }) => route.path.startsWith('/bulk/')),
    source
  }
})

/** The utils schemas, as shared fragments. */
export const fragments = (
  await joiExportsIn(path.join(backend, 'node_modules', UTILS), UTILS)
).map(({ module, name, file, schema }) => ({
  file,
  schema,
  source: { module, name }
}))

/**
 * The source of a module like this one for the browser bundle: the same roots
 * and fragments, with each schema imported from the module that exports it.
 * @param {string[]} [fragmentFiles] the fragments to include (default all)
 */
export const browserModule = (fragmentFiles) => {
  const included = fragmentFiles
    ? fragments.filter((f) => fragmentFiles.includes(f.file))
    : fragments
  const imports = []
  const ref = ({ source }) => {
    imports.push(
      `import { ${source.name} as s${imports.length} } from ${JSON.stringify(source.module)}`
    )
    return `s${imports.length - 1}`
  }
  // A route's own schema is reached through the route, which a browser can't
  // import.
  for (const r of roots) {
    if (r.source.inRoute) {
      throw new Error(
        `The legacy explorer can't bundle ${r.file}: export its payload schema from src/schemas/`
      )
    }
  }
  const entry = (item) => {
    const name = ref(item)
    const { schema, source, ...rest } = item
    return `{ ...${JSON.stringify(rest)}, schema: ${name} }`
  }
  const rootsSource = roots.map((r) => entry(r)).join(',\n  ')
  const fragmentsSource = included.map((f) => entry(f)).join(',\n  ')
  return `${imports.join('\n')}
export const roots = [
  ${rootsSource}
]
export const fragments = [
  ${fragmentsSource}
]
`
}
