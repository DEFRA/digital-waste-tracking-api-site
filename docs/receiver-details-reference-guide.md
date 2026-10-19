# Receipt of waste: receiver details reference guide

This guide provides implementation and test guidance for the DWT receipt flow. It covers the receiver details captured with a receipt, not the full waste-movement data contract.

## Purpose

When an authenticated user submits a receipt for transfer of waste, the receiving organisation and site must be identified accurately so regulators can attribute the receipt to the correct receiver and support the receiver's duty-of-care obligations.

## Preconditions

Before validating or creating the receipt, the receipt submitter must:

- be authenticated
- provide a valid API code
- provide a valid Delivery ID

## Receiver information

The receipt must contain one receiver declaration. The declared receiver has the following information:

| Information | Requirement |
| --- | --- |
| Site name | Required. |
| Authorisation number | Required and must match a valid UK authorisation-number format. Reuse the existing `isValidAuthorisationNumber` validation based on the RoW codebase's existing expression rather than introducing a divergent rule. |
| Receipt address | Required. The postcode is required; the full address is optional under the shared address schema. |
| Contact details | At least one of email address or phone number is required. Either may be supplied on its own; both may also be supplied. Each value must be validated. |

Receipt receiver details are not an array, and are therefore unlike receiver details at creation. Validation follows the shared address schema already used for the producer and broker/dealer (postcode required, UK postcode format; full address optional):

The example below shows one receiver object. It illustrates the data shape, not the endpoint's property name; use the approved receipt contract for that.

```
type ReceiverDetails = {
  siteName: string // required
  authorisationNumber: string // required; valid UK authorisation number format
  address: Address // required; postcode required, fullAddress optional
  contactDetails: ContactDetails // at least one contact method required
}

type ContactDetails = {
  // at least one of emailAddress / phoneNumber required; both allowed
  emailAddress?: string // standard email format
  phoneNumber?: string // valid phone number
}
```

## Validation and outcomes

Reject the receipt and return a useful field-level validation error when any of these conditions apply:

| Condition | Expected outcome |
| --- | --- |
| No receiver is supplied | Do not create the receipt; report that receiver details are required. |
| More than one receiver is supplied | Do not create the receipt; report that only one receiver is required. |
| Site name is missing | Do not create the receipt; report that a site name is required. |
| Authorisation number is missing | Do not create the receipt; report that an authorisation number is required. |
| Authorisation number is malformed | Do not create the receipt; report that the authorisation number is invalid. |
| Receipt address or required postcode is missing | Do not create the receipt; report that the receipt address is required. |
| Postcode is invalid | Do not create the receipt; report that the postcode is invalid. |
| Both email address and phone number are missing | Do not create the receipt; report that at least one contact method is required. |
| A supplied email address is invalid | Do not create the receipt; report that the email address is invalid. |
| A supplied phone number is invalid | Do not create the receipt; report that the phone number is invalid. |
| All required receiver information is valid | Create the receipt. |

Use the existing validation envelope (D-039) and field-level errors keyed to the receiver field, in the form `Receivers.<field>`. Match the exact casing and property names to the approved endpoint schema and existing API error conventions.

UK postcode is required, in standard format. This is acceptable even without a full postal address.

## Suggested implementation flow

1. Validate the receipt submitter's authentication, API code and Delivery ID using the existing receipt flow.
2. Read the receiver declaration from the receipt request using the approved contract field and shape.
3. Require exactly one actual receiver; reject a missing receiver or multiple receivers.
4. Validate the site name, authorisation number, receipt address and postcode, and contact details.
5. Reuse the existing authorisation-number, address, email and phone validators wherever available. Avoid duplicating validation rules in the receipt-specific code.
6. If validation fails, return the standard validation envelope with actionable field-level errors and do not create a partial receipt.
7. If validation succeeds, persist the receiver details as part of the receipt so the receiver can be identified in regulatory reporting.

## Acceptance-test checklist

- A valid receiver with valid site name, authorisation number, receipt address and contact details creates a receipt.
- A receipt with more than one receiver is rejected with an explanation that only one is allowed.
- A receiver with only a valid email address is accepted.
- A receiver with only a valid phone number is accepted.
- A receiver with both a valid phone number and a valid email is accepted.
- Missing site name, authorisation number or receipt address is rejected with the corresponding field error.
- Missing both contact methods is rejected; missing either one alone is accepted.
- Invalid authorisation number, postcode, email address and phone number are each rejected with the corresponding field error.
- Authentication, API code and Delivery ID preconditions are covered by the existing receipt-flow tests.
- Validation errors use the existing envelope and identify the invalid receiver field.
- Missing UK postcode or invalid UK postcode format is rejected.
- No receipt is persisted on any validation failure.

## Data protection and non-functional impact

The ticket records no additional non-functional impact beyond standard conformance. It also says receiver contact details are already collected at receipt in production, so this change does not introduce a new category of personal data or require additional data-protection work according to the story.

## Source

- [DWTC-233: Receipt - Reporting the receiver details](https://eaflood.atlassian.net/browse/DWTC-233)
- [Software Journey View](journey-scenarios-beta-1.md)

## Questions for stakeholders

The current receipt schema in the [beta-2 API specification](api/openapi-beta-2.md) differs from details in DWTC-233 and this guide. Please confirm the intended requirements before we align the API documentation:

- **Receiver field name and shape:** Should the request use the current schema's single `receiverSite` object, or a different receiver property and shape?
- **Contact details:** Should email address and phone number be nested inside `contactDetails`, or remain top-level fields on `receiverSite` as in the current schema?
- **Postcode formats:** Should the receipt accept UK postcodes only, as this guide states, or also Irish Eircodes as in the current address schema?
- **Full address:** Is `fullAddress` optional, as this guide says, or required for a physical receipt site as in the current schema?
- **Validation error paths:** Should field-level errors use `Receivers.<field>` as stated in DWTC-233, or use paths based on the current `receiverSite` field?
