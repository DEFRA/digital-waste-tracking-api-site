# Receipt of waste: journey scenarios - Beta 2

The Digital Waste Tracking API will enable a variety of journey scenarios which will be rolled out through the various Beta incarnations. Beta 2 includes 4 new journeys added to the original 4 journeys in Beta 1.

## Beta 1

## 1. Single non-hazardous movement

A waste movement is made up of 4 events:

1. Create the movement with `POST /movements`. This returns a Movement ID.
2. Record the collection with `POST /movements/{movementId}/collection`.
3. Record the delivery with `POST /deliveries`. This returns a Delivery ID.
4. Record the receipt with `POST /deliveries/{deliveryId}/receipt`.

You need a valid Movement ID to record a collection or a delivery.

![Single movement](./images/dwt-scenario-01-single-movement.png)

## 2. Several non-hazardous movements delivered together

You can deliver several non-hazardous movements to a receiving site in one delivery. To do this, list all their Movement IDs when you call `POST /deliveries`. This returns one new Delivery ID for the whole group. 

The receiving site uses this Delivery ID to record the receipt, using `POST /deliveries/{deliveryId}/receipt`.

![Several movements, one delivery](./images/dwt-scenario-02-several-movements-one-delivery.png)

## 3. Waste delivered to more than one receiving site

Waste from one or more movements can be split between more than one receiving site. List the Movement IDs when you call `POST /deliveries`. Each receiving site then records its own receipt against the Delivery ID, using `POST /deliveries/{deliveryId}/receipt`.

![More than one receiving site](./images/dwt-scenario-03-more-than-one-receiving-site.png)


## 4. Waste received without a Delivery ID

A receiving site can accept waste that arrives without a Delivery ID. Record the receipt with `POST /receipts`, and explain why there’s no Delivery ID in `reasonForNoDeliveryId`. This returns a new Delivery ID for the receipt.

![Received without delivery ID](./images/dwt-scenario-04-received-without-delivery-id.png)


## Beta 2

## 5. Hazardous movement

A movement is hazardous if any of its waste items has a hazardous European Waste Catalogue (EWC) code when you create it with `POST /movements`. It stays hazardous for all 4 events.

When you record the delivery, `POST /deliveries` still returns a Delivery ID, however this is the same code as the initial Movement ID. Use it to record the receipt in the usual way.

![Hazardous movement](./images/dwt-scenario-05-hazardous-movement.png)


## 6. Hazardous and non-hazardous movements delivered together

You can include hazardous and non-hazardous movements in the same `POST /deliveries` request. The response gives you:

  • one new Delivery ID for all the non-hazardous movements together
  • one Delivery ID for each hazardous movement, which is the same as its initial Movement ID

Hazardous movements cannot be grouped with other hazardous movements for receipt.

![Hazardous and non-hazardous together](./images/dwt-scenario-06-hazardous-and-non-hazardous-together.png)


## 7. Movement with a handover from carrier to carrier

A movement can have more than one collection. This lets you record waste passing from one carrier to another before it’s delivered.
Set collectionType when you call `POST /movements/{movementId}/collection`:

  • `STATIC` for a collection from a fixed location, such as the producer’s site
  • `TRANSIT` for a collection from another vehicle

The first collection must be `STATIC`. Every collection after that must be `TRANSIT`.

![Carrier to carrier handover](./images/dwt-scenario-07-carrier-to-carrier-handover.png)


## 8. Linking related movements

Some jobs need more than one movement, for example when waste is removed over several trips.

To link these movements, add the same reference to each one when you create it with `POST /movements`.

![Linking related movements](./images/dwt-scenario-08-linking-related-movements.png)














