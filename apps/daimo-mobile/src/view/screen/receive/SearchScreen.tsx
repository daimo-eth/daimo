import { TextInput, View } from "react-native";

import { useContactsPermission } from "../../../logic/systemContacts";
import { InputBig } from "../../shared/InputBig";
import { SearchResults } from "../../shared/SearchResults";
import Spacer from "../../shared/Spacer";
import { ss } from "../../shared/style";

/** Find someone you've already paid, a Daimo user by name, Ethereum account by ENS,
 *  or a system contact with phone number or email. */
export function ReceiveSearch({
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
      <View style={ss.container.marginHNeg16}>
        <SearchResults
          contactsAccess={contactsAccess}
          prefix={prefix}
          mode="receive"
        />
      </View>
    </>
  );
}
