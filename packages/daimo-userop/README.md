# Daimo Userop

This library constructs all userops sent by a Daimo account.

Example usage:

```ts
import { DaimoOpSender } from "@daimo/userop";

// Create DaimoOpConfig, then send some of that account's home coin (eg USDC).
const sender = DaimoOpSender.init(config);
sender.erc20Transfer(toAddress, amount, nonceMetadata);
```

See `apps/daimo-mobile` for more examples. Built with `userop.js`.
