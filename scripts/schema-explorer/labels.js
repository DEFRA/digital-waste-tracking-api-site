// The names the explorer shows in place of the ones the backend gives. Anything
// not listed here keeps its name from the backend: a version its folder name, a
// beta schema its JSON Schema title, a legacy schema its export name. Folders,
// ids and so URLs don't change.

// By version folder, in the switcher and headings.
export const VERSION_NAMES = {
  legacy: 'ReceiptOfWaste'
}

// By top-level schema id without "-request" / "-response", so a request and its
// response share a name. The navigation lists these first, in this order, and
// the rest after them in the order the backend has them.
export const ROOT_NAMES = {
  'create-movement': 'Creation',
  'record-collection': 'Collection',
  // beta-1's name for the collection.
  'create-collection': 'Collection',
  'record-delivery': 'Delivery',
  'record-receipt': 'Receipt',
  'record-receipt-undocumented': 'Receipt (undocumented)',
  // beta-1's name for the undocumented receipt.
  'record-receipt-without-delivery': 'Receipt (undocumented)',
  // The legacy routes, by the export name of their Joi schema.
  movement: 'Receive movement request',
  'bulk-receive-movement': 'Bulk receive movement request',
  'bulk-update-movement': 'Bulk update movement request'
}
