// The checks a beta route runs on a request body after its JSON Schema: rules a
// schema can't say, such as EWC and POP codes against the reference data, or a
// date-time not being in the future (see src/schemas/validate/payload-checks.js).
// The routes pass them to withPayloadChecks, where nothing outside can read
// them, so they're listed here by version and request schema file, and the
// "Try it" view runs the same ones. A request schema not listed has none.
//
// Which route takes which schema comes from each version's openapi.json, so a
// new route needs nothing here unless it has checks. checks.test.js runs every
// beta route's own payload validation against the page's, so a route whose
// checks differ from these fails there.
//
// The checks are the API's own functions, not copies: the page gets them
// bundled by checks/bundle.js.

import { wasteReferenceDataChecks } from '../../../src/common/helpers/waste-reference-data-checks.js'
import {
  emptyIsNotProvided,
  notInFuture
} from '../../../src/common/helpers/date-time-checks.js'

const receiptDateTime = ['receiptDateTime']

export const checks = {
  'beta-2': {
    'creation/create-movement-request.schema.json': [wasteReferenceDataChecks],
    'receipt/record-receipt-request.schema.json': [
      emptyIsNotProvided(receiptDateTime),
      notInFuture(receiptDateTime)
    ],
    'receipt/record-receipt-undocumented-request.schema.json': [
      wasteReferenceDataChecks,
      emptyIsNotProvided(receiptDateTime),
      notInFuture(receiptDateTime)
    ]
  }
}

/**
 * Runs a request body's checks after its schema, as withPayloadChecks does.
 * @param {string} version e.g. "beta-2"
 * @param {string} file the request schema file, relative to the version folder
 * @param {unknown} payload
 * @param {{ message: string, path: string[], type: string }[]} details the
 *   schema's errors, in hapi-validator's detail shape
 * @returns the errors to report, in the same shape
 */
export const runChecks = (version, file, payload, details) =>
  (checks[version]?.[file] ?? []).reduce(
    (found, check) => check(payload, found),
    details
  )

/** @returns {string[]} the schema files in a version that have checks */
export const checkedFiles = (version) => Object.keys(checks[version] ?? {})
