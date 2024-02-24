/* eslint-disable @next/next/no-img-element */
import { daimoDomainAddress } from "@daimo/common";
import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

// Generate link preview image
// Note that a lot of usual CSS is unsupported, including tailwind.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (!searchParams.has("name")) {
    throw new Error("Invalid preview params");
  }

  const name = searchParams.get("name")!;
  const action = searchParams.get("action") || undefined;
  const dollars = searchParams.has("dollars")
    ? Number(searchParams.get("dollars")).toFixed(2)
    : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor: "white",
          height: "100%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            backgroundImage: `url("${daimoDomainAddress}/assets/preview-pixel-bg.svg")`,
            height: "100%",
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            flexDirection: "column",
          }}
        >
          <Content name={name} action={action} dollars={dollars} />
          <Footer />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

function Content({
  name,
  action,
  dollars,
}: {
  name: string;
  action: string | undefined;
  dollars: string | undefined;
}) {
  return (
    <div
      style={{
        height: "80%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "50%",
          alignItems: "flex-end",
          justifyContent: "center",
          flexDirection: "column",
          paddingRight: "24px",
        }}
      >
        <UserBubble name={name} />
      </div>
      <div
        style={{
          display: "flex",
          width: "50%",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          flexDirection: "column",
          paddingLeft: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            flexDirection: "column",
            fontSize: 48,
          }}
        >
          <div>{name}</div>
          {action && <div style={{ color: "#717171" }}>{action}</div>}
        </div>
        {dollars && (
          <div
            style={{
              fontSize: 72,
              color: "#262626",
            }}
          >
            {`$${dollars}`}
          </div>
        )}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div
      style={{
        height: "10%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        justifyItems: "center",
        marginBottom: "48px",
      }}
    >
      <img
        alt="Daimo"
        src={`${daimoDomainAddress}/logo-scalable.svg`}
        height="100%"
        style={{ marginRight: "24px" }}
      />
      <div
        style={{
          fontSize: 48,
          color: "#262626",
        }}
      >
        Daimo
      </div>
    </div>
  );
}

// TODO: support rich profile custom images
function UserBubble({ name }: { name: string }) {
  const inBubbleText = String.fromCodePoint(
    name.codePointAt(0) || "?".charCodeAt(0)
  ).toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        width: "256px",
        height: "256px",
        borderRadius: "9999px",
        backgroundColor: "white",
        border: "1px solid #007aff",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          color: "#007aff",
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
