# Receipt of waste: journey scenarios - Beta 1

The Digital Waste Tracking API will enable a variety of journey scenarios which will be rolled out through the various Beta incarnations. Beta 1 will include 4 journeys.

## B1A - Single non-hazardous movement

A waste movement is made up of 4 events:

1. Create the movement with `POST /movements`. This returns a Movement ID.
2. Record the collection with `POST /movements/{movementId}/collection`.
3. Record the delivery with `POST /deliveries`. This returns a Delivery ID.
4. Record the receipt with `POST /deliveries/{deliveryId}/receipt`.

You need a valid Movement ID to record a collection or a delivery.

![Single movement](./images/dwt-scenario-01-single-movement.png)

## B1B - Several non-hazardous movements delivered together

You can deliver several non-hazardous movements to a receiving site in one delivery. To do this, list all their Movement IDs when you call `POST /deliveries`. This returns one new Delivery ID for the whole group. 

The receiving site uses this Delivery ID to record the receipt, using `POST /deliveries/{deliveryId}/receipt`.

![Several movements, one delivery](./images/dwt-scenario-02-several-movements-one-delivery.png)

## B1C - Waste delivered to more than one receiving site

Waste from one or more movements can be split between more than one receiving site. List the Movement IDs when you call `POST /deliveries`. Each receiving site then records its own receipt against the Delivery ID, using `POST /deliveries/{deliveryId}/receipt`.

![Several movements, one delivery](./images/dwt-scenario-03-more-than-one-receiving-site.png)

## B1D - Waste received without a Delivery ID

A receiving site can accept waste that arrives without a Delivery ID. Record the receipt with `POST /receipts`, and explain why there’s no Delivery ID in `reasonForNoDeliveryId`. This returns a new Delivery ID for the receipt.

![Several movements, one delivery](./images/dwt-scenario-04-received-without-delivery-id.png)
