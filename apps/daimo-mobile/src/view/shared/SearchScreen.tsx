import { useState } from "react";
import { TextInput, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

import { InputBig } from "./InputBig";
import { PressableText } from "./PressableText";
import { SearchResults } from "./SearchResults";
import Spacer from "./Spacer";
import { i18n } from "../../i18n";
import { useContactsPermission } from "../../logic/systemContacts";
import { useTheme } from "../style/theme";

/** Find someone you've already paid, a Daimo user by name, Ethereum account by ENS,
 *  or a system contact with phone number or email. */
type SearchScreenProps = {
  prefix: string;
  setPrefix: (prefix: string) => void;
  autoFocus?: boolean;
  textInputRef: React.RefObject<TextInput>;
  mode: "send" | "receive";
};

const i18 = i18n.searchScreen;

export function SearchScreen({
  prefix,
  setPrefix,
  autoFocus,
  textInputRef,
  mode,
}: SearchScreenProps) {
  const { ss } = useTheme();
  const [inputFocused, setInputFocused] = useState(autoFocus ?? false);
  const contactsAccess = useContactsPermission();

  const placeHolderText = contactsAccess.permission?.granted
    ? i18.placeholderWithContact()
    : i18.placeholderWithoutContact();

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
            <PressableText
              text={i18.cancel()}
              onPress={blurInput}
              style={{ marginLeft: 16 }}
            />
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
