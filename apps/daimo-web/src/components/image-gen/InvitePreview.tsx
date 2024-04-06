import { getAbsoluteUrl } from "../../utils/getAbsoluteUrl";

export function InvitePreviewImg({ name }: { name: string }) {
  return (
    <div
      style={{
        backgroundColor: "white",
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          backgroundImage: `url("${getAbsoluteUrl(
            "/assets/frame/InvitePowerUserDynamic.png"
          )}")`,
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          paddingTop: 74,
        }}
      >
        <Content name={name} />
      </div>
    </div>
  );
}

function Content({ name }: { name: string }) {
  return (
    <div>
      <div
        style={{
          color: "#8b5af6",
          fontSize: 18,
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        +$10 BONUS FOR POWER USERS
      </div>
      <div style={{ fontSize: 36, textAlign: "center" }}>
        Join {name} on <span>Daimo.</span>
      </div>
    </div>
  );
}
