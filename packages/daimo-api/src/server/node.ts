import os from "node:os";
import v8 from "node:v8";

// Returns node resource usage, eg. {
//   mem: { heapMB: 123, maxMB: 1024 },
//   cpu: { load1m: 0.5, load5m: 0.1, load15m: 0.05 }
// }
export function getNodeMetrics() {
  const memoryData = v8.getHeapStatistics();
  const loadAvg = os.loadavg();
  return {
    mem: {
      heapMB: memoryData.total_heap_size / 1024 / 1024,
      maxMB: memoryData.heap_size_limit / 1024 / 1024,
    },
    cpu: {
      load1m: loadAvg[0],
      load5m: loadAvg[1],
      load15m: loadAvg[2],
    },
  };
}
