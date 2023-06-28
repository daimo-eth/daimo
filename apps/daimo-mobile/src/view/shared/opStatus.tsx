import { Octicons } from "@expo/vector-icons";
import { Text } from "react-native";

import { OpStatus } from "../../model/op";

export function OpStatusIndicator({
  status,
  size,
}: {
  status: OpStatus;
  size?: number;
}) {
  size = size || 16;
  switch (status) {
    case "pending":
      return <Octicons name="dot" size={size} color="orange" />;
    case "confirmed":
      return <Octicons name="dot-fill" size={size} color="green" />;
    case "failed":
      return <Octicons name="x" size={size} color="red" />;
    case "finalized":
      return <Octicons name="check" size={size} color="green" />;
    default:
      throw new Error(`unknown status ${status}`);
  }
}

export function OpStatusName({ status }: { status: OpStatus }) {
  switch (status) {
    case "pending":
      return <Text>Pending</Text>;
    case "confirmed":
      return <Text>Confirmed</Text>;
    case "failed":
      return <Text>Failed</Text>;
    case "finalized":
      return <Text>Finalized</Text>;
    default:
      throw new Error(`unknown status ${status}`);
  }
}
