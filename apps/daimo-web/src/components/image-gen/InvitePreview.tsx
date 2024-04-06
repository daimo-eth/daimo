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
            "/assets/frame/InvInitPowerUserDynamic.png"
          )}")`,
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
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
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div
        style={{
          display: "block",
          color: "#8b5af6",
          fontSize: 18,
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        +$10 BONUS FOR POWER USERS
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          fontSize: 36,
          textAlign: "center",
          gap: 8,
        }}
      >
        Join {name} on <span style={{ color: "#489e35" }}>Daimo.</span>
      </div>
    </div>
  );
}
