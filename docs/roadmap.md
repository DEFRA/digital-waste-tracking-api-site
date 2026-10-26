# Digital Waste Tracking API - Roadmap

**Current status:** The first 'development milestone' of the service was Beta-1, completed in Sep/Oct 2026. This rollout tested basic API interactions in a sandbox environment to ensure proof of concept and identify potential issues.

The team is currently focused on **Beta-2**, with key input from software providers across a range of journey scenarios to further develop and refine the service.

## Beta-1: Contract API test

**Earliest integrated service - Sep/Oct 2026**

All POST endpoints made available, with only validation against the payload structure, no individual data item validation.

Ability to map identifiers and events to new or existing entities in your system.

1. Acknowledge waste movement
2. Acknowledge collection using Movement ID
3. Acknowledge delivery (incl. array of Movement IDs)
4. Acknowledge receipt using Delivery ID

<br>

## Beta-2: Create end-to-end waste movement

**Earliest testable service - Oct/Nov 2026**

All POST endpoints amended to include full validation and conditionality against individual data items.

Ability to map data points to the DWT schema and design for curated scenarios and validation messages.

1. Report a waste movement
2. Report a collection using Movement ID
3. Report a delivery (incl. array of Movement IDs)
4. Report a receipt using Delivery ID

<br>

## Beta-3: Update, retrieve and reject

**Earliest usable service - Nov/Dec 2026**

All `PUT` and `GET` endpoints made available.

Ability to design amendment and retrieval processes in your system.

1. Report a waste movement - UPDATE
2. Report a collection using Movement ID - UPDATE
3. Report a delivery (incl. array of Movement IDs) - REPORT A REJECTION
4. Report a receipt using Delivery ID - UPDATE - REPORT A REJECTION

<br>

## Beta-4: Final iterations

**Production-ready API - Jan 2027**

Any final iterations and feedback that could not be deployed previously.

1. Report a waste movement - UPDATE
2. Report a collection using Movement ID - UPDATE
3. Report a delivery (incl. array of Movement IDs) - REPORT A REJECTION
4. Report a receipt using Delivery ID - UPDATE - REPORT A REJECTION
