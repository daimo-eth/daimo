import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

import { InputBig } from "./InputBig";
import { SearchResults } from "./SearchResults";
import Spacer from "./Spacer";
import { color, ss } from "./style";
import { TextBody } from "./text";
import { useContactsPermission } from "../../logic/systemContacts";

/** Find someone you've already paid, a Daimo user by name, Ethereum account by ENS,
 *  or a system contact with phone number or email. */
type SearchScreenProps = {
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
  const [inputFocused, setInputFocused] = useState(autoFocus ?? false);
  const contactsAccess = useContactsPermission();

  const placeHolderText = contactsAccess.permission?.granted
    ? "Search user, ENS, contact, or email..."
    : "Search user, ENS, email, or phone...";

  const handleFocus = () => {
    setInputFocused(true);
  };

  const handleBlur = () => {
    setInputFocused(false);
  };

  const blurInput = () => {
    textInputRef.current?.blur();
  };

  return (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", flexGrow: 0 }}>
        <Animated.View layout={LinearTransition} style={{ flex: 1 }}>
          <InputBig
            innerRef={textInputRef}
            autoFocus={autoFocus}
            icon="search"
            placeholder={placeHolderText}
            value={prefix}
            onChange={setPrefix}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </Animated.View>
        {inputFocused && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <Pressable style={{ marginLeft: 16 }} onPress={blurInput}>
              {({ pressed }) => (
                <TextBody color={pressed ? color.gray3 : color.grayMid}>
                  Cancel
                </TextBody>
              )}
            </Pressable>
          </Animated.View>
        )}
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
