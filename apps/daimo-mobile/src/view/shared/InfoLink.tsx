import { Octicons } from "@expo/vector-icons";

import { ButtonSmall } from "./Button";
import { color } from "./style";

export function InfoLink({ url, title }: { url: string; title: string }) {
  return (
    <ButtonSmall onPress={() => window.open(url)}>
      {title} <Octicons name="info" size={16} color={color.gray} />
    </ButtonSmall>
  );
}

// const styles = StyleSheet.create({
//   infoLink: {
//     backgroundColor: color.bg.lightGray,
//     padding: 8,
//     borderRadius: 4,
//   },
// });
