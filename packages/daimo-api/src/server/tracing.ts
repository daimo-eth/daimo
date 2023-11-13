import { HoneycombSDK } from "@honeycombio/opentelemetry-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

const isEnabled = (process.env.HONEYCOMB_API_KEY || "") !== "";
console.log(`[TRACING] initializing Honeycomb. enabled: ${isEnabled}`);
const sdk = new HoneycombSDK({
  dataset: "daimo-api",
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
    }),
  ],
});

sdk.start();
