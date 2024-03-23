import { UserBubble } from "./UserBubble";
import { getAbsoluteUrl } from "../../utils/getAbsoluteUrl";

export function LinkPreviewImg({
  name,
  action,
  dollars,
  paidBy,
  cancelled,
}: {
  name: string;
  action?: string;
  dollars?: string;
  paidBy?: string;
  cancelled?: boolean;
}) {
  return (
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
          backgroundImage: `url("${getAbsoluteUrl(
            "/assets/preview-pixel-bg.svg"
          )}")`,
          height: "100%",
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "column",
        }}
      >
        <Content name={name} action={action} dollars={dollars} />
        <Footer paidBy={paidBy} cancelled={cancelled} />
      </div>
    </div>
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

function Footer({
  paidBy,
  cancelled,
}: {
  paidBy?: string;
  cancelled?: boolean;
}) {
  const hasStatus = paidBy || cancelled;
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
      {!hasStatus && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Daimo"
            src={getAbsoluteUrl(`/logo-link-preview-scalable.svg`)}
            height="100%"
            style={{ marginRight: "24px" }}
          />
        </>
      )}
      <div
        style={{
          fontSize: 48,
          color: "#262626",
        }}
      >
        {cancelled ? `❌` : paidBy ? `✅ Paid by ${paidBy}` : "Daimo"}
      </div>
    </div>
  );
}
