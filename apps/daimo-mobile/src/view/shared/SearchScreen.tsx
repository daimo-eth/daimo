import { TextInput, View } from "react-native";

import { InputBig } from "./InputBig";
import { SearchResults } from "./SearchResults";
import Spacer from "./Spacer";
import { ss } from "./style";
import { useContactsPermission } from "../../logic/systemContacts";

/** Find someone you've already paid, a Daimo user by name, Ethereum account by ENS,
 *  or a system contact with phone number or email. */
export type SearchScreenProps = {
  prefix: string;
  setPrefix: (prefix: string) => void;
  autoFocus?: boolean;
  textInputRef: React.RefObject<TextInput>;
  mode: "send" | "receive";
};

export function SearchScreen({
  prefix,
  setPrefix,
  autoFocus,
  textInputRef,
  mode,
}: SearchScreenProps) {
  const contactsAccess = useContactsPermission();

  const placeHolderText = contactsAccess.permission?.granted
    ? "Search user, ENS, contact, or email..."
    : "Search user, ENS, email, or phone...";

  return (
    <>
      <View style={{ flexGrow: 0 }}>
        <InputBig
          innerRef={textInputRef}
          autoFocus={autoFocus}
          icon="search"
          placeholder={placeHolderText}
          value={prefix}
          onChange={setPrefix}
        />
      </View>
      <Spacer h={16} />
      <View style={ss.container.marginHNeg16}>
        <SearchResults
          contactsAccess={contactsAccess}
          prefix={prefix}
          mode={mode}
        />
      </View>
    </>
  );
}
