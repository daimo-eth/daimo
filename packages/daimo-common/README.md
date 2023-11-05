## Common data structures

These are used across Daimo app, website, and API server.

### Addresses and accounts

We use the Viem `Address` for ERC-55 capitalized addresses. `EAccount`
represents an Ethereum account with name information. For example,

```
{ addr: "0x6982EbcC08E938FFBbCc66EdFa28cc6cFed2b741" }
{ addr: "0xc60A0A0E8bBc32DAC2E03030989AD6BEe45A874D", ensName: "dcposch.eth" }
{ addr: "0x2A6d311394184EeB6Df8FBBF58626B085374Ffe7", label: "faucet" }
{ addr: "0x4Fe4e666Be5752f1FdD210F4Ab5DE2Cc26e3E0e8", name: "ansgar" }
```

The last one is also a `DAccount`, a subset of `EAccount` for Daimo accounts,
which have a name.

### Dollars and amounts

Amounts in Daimo are stored and transmitted in two ways:

- As bigint `amount`, eg `1500000`
- As string `dollars`, eg `"1.50"`
  ...each can be losslessly converted to the other. See `amountToDollars` and
  `dollarsToAmount`.

Neither of these are intended for display, which is locale-specific, eg "$1,50".

Respect the naming convention and always refer to amounts in coin units (for
USDC, 1000000 = $1). Dollars should always be stored and transmitted as strings
to avoid float rounding bugs.

### Daimo links

These are app deep links. For example

- `https://daimo.com/link/account/ansgar`
- `https://daimo.com/link/request/...`
- `https://daimo.com/link/note/...`

...all can be parsed or serialized to/from `DaimoLink`.

These are part of the website as well as the app.
