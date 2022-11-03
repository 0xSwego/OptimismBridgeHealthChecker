# Optimism Bridge Health Checker

## The Bridge Issue

Bridges are a fundamental, but particularly delicate piece of the DeFi ecosystem. They got hacked multiple times in the past, resulting in billions of dollars of funds stolen (some of which have been recovered).

Due to their delicacy, it is opportune to keep an eye on bridges health and make sure no red flags are triggered before of using them. Although this way is not infallible, it helps reducing the chances to get caught in the middle of a hack or a disruptive event.

## Checking the Bridge health

Each bridge has its own inner functioning, but the gist is that users send funds from one side, where these funds will be locked/burned. An off-chain relayer will be listening to such events, and authorize the withdraw of funds on the other side, where they will be unlocked/minted. L1 to L2 bridges are a particularly simple instance of bridges, as there is only 1 link, from L1, to L2. Multichain bridges present a tougher challenge as a multitude of chains would have to be taken into account.

A basic strategy to monitor any bridge health is to keep an eye on inflows vs outflows. For each one of the two sides:

- If `outflows > inflows`, **there is a serious problem** and maybe a hack is taking place.
- If `inflows > outflows + threshold`, it would seem that the bridge is unlocking funds slowly or not at all and **caution is recommended**.

Another strategy might be to monitor bridge-specific aspects. To keep it simple, I'll check whether the relayer is `paused`. If that was the case, the bridge would become unusable and it would be best to wait some time before of using it.
