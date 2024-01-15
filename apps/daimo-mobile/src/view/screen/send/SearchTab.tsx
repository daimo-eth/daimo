import { TextInput, View } from "react-native";

import { SearchResults } from "./SearchResults";
import { useContactsPermission } from "../../../logic/systemContacts";
import { InputBig } from "../../shared/InputBig";
import Spacer from "../../shared/Spacer";

/** Find someone you've already paid, a Daimo user by name, Ethereum account by ENS,
 *  or a system contact with phone number or email. */
export function SearchTab({
  prefix,
  setPrefix,
  autoFocus,
  textInputRef,
}: {
  prefix: string;
  setPrefix: (prefix: string) => void;
  autoFocus?: boolean;
  textInputRef: React.RefObject<TextInput>;
}) {
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
      <SearchResults
        contactsAccess={contactsAccess}
        prefix={prefix}
        mode="send"
      />
    </>
  );
}
