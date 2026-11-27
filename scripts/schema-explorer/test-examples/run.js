// Runs the backend's beta schema tests (src/schemas/beta-*) under a stand-in for
// Jest's globals, recording every payload the API's validate() accepts while
// they run (hooks.js), and writes them to stdout as JSON:
// { "beta-2/common/carrier.schema.json": [{ "test": "…", "value": … }, …] }.
//
// The tests' assertions don't run: expect() accepts anything. A test that
// throws is skipped. Only what the real validator accepted is recorded, so
// every value is valid against the schemas as they are.
//
// Run by index.js in a process of its own, so the hooks and globals stay here.

import fs from 'node:fs'
import path from 'node:path'
import { register } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

register('./hooks.js', import.meta.url)

const here = path.dirname(fileURLToPath(import.meta.url))
const schemasRoot = path.resolve(here, '../../../src/schemas')

// ---------------------------------------------------------------------------
// Jest's globals, enough to collect and run the tests.

// Takes any call or property, and isn't a thenable, so `await expect(…)` ends.
const anything = new Proxy(function () {}, {
  get: (_, key) => (key === 'then' ? undefined : anything),
  apply: () => anything
})

const tests = []
const describe = (_name, fn) => fn()
const test = (name, fn) => {
  if (typeof fn === 'function') tests.push({ name: String(name), fn })
}

// test.each / describe.each: a row of an array table is spread into the
// callback; any other row is passed as it is. Names take printf-style
// placeholders and, for object rows, $field.
const format = (name, row, i) => {
  const args = Array.isArray(row) ? [...row] : [row]
  return String(name)
    .replace(/%#/g, String(i))
    .replace(/%[sdifjop]/g, () => {
      const v = args.shift()
      return typeof v === 'string' ? v : JSON.stringify(v)
    })
    .replace(/\$([A-Za-z_]\w*)/g, (m, key) =>
      row && typeof row === 'object' && key in row
        ? typeof row[key] === 'string'
          ? row[key]
          : JSON.stringify(row[key])
        : m
    )
}
const each = (define) => (table) => (name, fn) =>
  table.forEach((row, i) =>
    define(format(name, row, i), (...extra) =>
      Array.isArray(row) ? fn(...row, ...extra) : fn(row, ...extra)
    )
  )

for (const define of [describe, test]) {
  define.each = each(define)
  define.only = define
  define.skip = () => {}
  define.skip.each = () => () => {}
  define.only.each = define.each
}
test.todo = () => {}
test.concurrent = test

Object.assign(globalThis, {
  describe,
  test,
  it: test,
  expect: anything,
  jest: anything,
  beforeAll: (fn) => fn(),
  beforeEach: () => {},
  afterEach: () => {},
  afterAll: () => {}
})

// ---------------------------------------------------------------------------

const found = {}
const seen = {}
let current = null
globalThis.recordExample = (schemaId, payload) => {
  if (!current) return
  const value = structuredClone(payload)
  const key = JSON.stringify(value)
  seen[schemaId] ??= new Set()
  if (seen[schemaId].has(key)) return
  seen[schemaId].add(key)
  ;(found[schemaId] ??= []).push({ test: current, value })
}

const testFiles = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && e.name.endsWith('.test.js'))
    .map((e) => path.join(e.parentPath ?? e.path, e.name))
const files = [
  ...fs
    .readdirSync(schemasRoot, { withFileTypes: true })
    .filter((e) => /^beta-\d+(\.test\.js)?$/.test(e.name))
    .flatMap((e) =>
      e.isDirectory()
        ? testFiles(path.join(schemasRoot, e.name))
        : [path.join(schemasRoot, e.name)]
    )
].sort()

for (const file of files) {
  tests.length = 0
  try {
    await import(pathToFileURL(file).href)
  } catch {
    continue
  }
  for (const t of tests) {
    current = t.name
    try {
      await t.fn()
    } catch {
      // An assertion we don't run, or a test that needs more than this: skip.
    }
  }
  current = null
}

// Exits once written: a test may leave something open, and exiting before a
// pipe has taken everything would cut the output short.
process.stdout.write(JSON.stringify(found), () => process.exit(0))
