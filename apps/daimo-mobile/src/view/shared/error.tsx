import { TextCenter, TextError } from "./text";

export function ErrorRowCentered({ error }: { error: { message?: string } }) {
  let message = error.message ?? "Unknown error";

  if (message.length > 200) {
    message = message.slice(0, 200) + "...";
  }

  return (
    <TextCenter>
      <TextError>{message}</TextError>
    </TextCenter>
  );
}
