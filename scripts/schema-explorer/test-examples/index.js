// Examples for the shared fragments, taken from the backend's own schema tests:
// run.js runs them and records every payload the API's validator accepts. So
// they change with the tests, and each one is valid against the schemas as
// they are.
//
// A table-driven test (test.each) can accept hundreds of values, e.g. every EWC
// code, so each schema keeps the first value from each test, up to
// MAX_PER_SCHEMA. The page names them by what sets each apart.

import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
export const MAX_PER_SCHEMA = 12

/**
 * @returns {Record<string, Record<string, unknown[]>>} by version, then by
 *   schema file within it, e.g. ["beta-2"]["common/carrier.schema.json"].
 *   Empty, with a warning, if the tests can't be run.
 */
export const testExamples = () => {
  let found
  try {
    found = JSON.parse(
      execFileSync(process.execPath, [path.join(here, 'run.js')], {
        stdio: ['ignore', 'pipe', 'pipe'],
        maxBuffer: 1 << 28
      })
    )
  } catch (err) {
    console.log(
      `::warning title=Schema explorer examples::Couldn't take examples from the backend's tests: ${err.message.split('\n')[0]}`
    )
    return {}
  }
  const byVersion = {}
  for (const [schemaId, recorded] of Object.entries(found)) {
    const [version, ...rest] = schemaId.split('/')
    const fromTests = new Set()
    const values = []
    for (const { test, value } of recorded) {
      if (fromTests.has(test) || values.length >= MAX_PER_SCHEMA) continue
      fromTests.add(test)
      values.push(value)
    }
    ;(byVersion[version] ??= {})[rest.join('/')] = values
  }
  return byVersion
}
