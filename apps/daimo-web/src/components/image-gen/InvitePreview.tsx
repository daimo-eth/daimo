import { getI18N } from "../../i18n";
import { getReqLang } from "../../i18n/server";
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
  const i18n = getI18N(getReqLang());
  const i18 = i18n.components.invitePreview;
  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div
        style={{
          display: "block",
          color: "#8b5af6",
          fontSize: 18,
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        {i18.bonusForPowerUsers()}
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
        {i18.joinNameOn(name)} <span style={{ color: "#489e35" }}>Daimo.</span>
      </div>
    </div>
  );
}
