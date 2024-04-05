import { getAbsoluteUrl } from "../../utils/getAbsoluteUrl";

export function InvitePreviewImg({ name }: { name: string }) {
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
        <Content />
      </div>
    </div>
  );
}

function Content() {
  return <div />;
}
