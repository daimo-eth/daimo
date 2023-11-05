import { TextCenter, TextError } from "./text";

export function ErrorRowCentered({ error }: { error: { message?: string } }) {
  let message = error.message ?? "Unknown error";
  console.log(`[ERROR] rendering ${message}`, error);

  if (message.toLowerCase() === "network request failed") {
    message = "Request failed. Offline?";
  } else if (message.length > 200) {
    message = message.slice(0, 200) + "...";
  }

  return (
    <TextCenter>
      <TextError>{message}</TextError>
    </TextCenter>
  );
}
