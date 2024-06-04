/* eslint-disable @next/next/no-img-element */
export function UserBubble({
  name,
  pfpUrl,
}: {
  name: string;
  pfpUrl?: string;
}) {
  const inBubbleText = String.fromCodePoint(
    name.codePointAt(0) || "?".charCodeAt(0)
  ).toUpperCase();

  // Show pfp if it exists
  if (pfpUrl) {
    return (
      <div
        style={{
          display: "flex",
          width: "256px",
          height: "256px",
          borderRadius: "50%",
        }}
      >
        {pfpUrl && (
          <div
            style={{
              display: "flex",
              width: "256px",
              height: "256px",
              borderRadius: "50%",
              overflow: "hidden",
            }}
          >
            <img
              src={`${pfpUrl}`}
              alt={"Profile"}
              style={{ width: "256px", height: "256px", objectFit: "cover" }}
            ></img>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        width: "256px",
        height: "256px",
        borderRadius: "9999px",
        backgroundColor: "white",
        border: "1px solid #13915F",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          color: "#13915F",
          fontSize: "128px",
          fontWeight: "bold",
          textAlign: "center",
          lineHeight: "256px",
        }}
      >
        {inBubbleText}
      </div>
    </div>
  );
}
