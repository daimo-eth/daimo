// TODO: support rich profile custom images
export function UserBubble({ name }: { name: string }) {
  const inBubbleText = String.fromCodePoint(
    name.codePointAt(0) || "?".charCodeAt(0),
  ).toUpperCase();

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
