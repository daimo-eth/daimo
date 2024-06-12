import { HoneycombSDK } from "@honeycombio/opentelemetry-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

import { getEnvApi } from "../env";

const isEnabled = getEnvApi().HONEYCOMB_API_KEY !== "";
console.log(`[TRACING] initializing Honeycomb. enabled: ${isEnabled}`);

if (isEnabled) {
  const sdk = new HoneycombSDK({
    dataset: "daimo-api",
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });

  sdk.start();
}
