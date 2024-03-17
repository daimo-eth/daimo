import type { Metadata } from "next";

import { TextH1, TextLight } from "../../../components/typography";
import { getAbsoluteUrl } from "../../../utils/getAbsoluteUrl";
import { inviteFrameLinks } from "../frameLink";
import { getFrameMetadata } from "../frameUtils";

interface LinkProps {
  params: { frameId: string };
}

export async function generateMetadata(props: LinkProps): Promise<Metadata> {
  const frameMetadata = getFrameMetadata({
    buttons: [
      {
        label: "🍼 Milk",
      },
    ],
    image: getAbsoluteUrl(`/assets/frame/daimoo-start.png`),
    post_url: getAbsoluteUrl(`/frame/${props.params.frameId}/callback`),
  });

  const metadata: Metadata = {
    title: "Daimoo",
    description: "Got USDC?",
    openGraph: {
      title: "Daimoo",
      description: "Got USDC?",
      images: [getAbsoluteUrl(`/assets/frame/cow-emoji.png`)],
    },
    other: {
      ...frameMetadata,
    },
  };

  return metadata;
}

export default function Page({ params }: LinkProps) {
  const frameId = Number(params.frameId);
  const frame = inviteFrameLinks.find((l) => l.id === frameId);
  return (
    <div className="p-4 max-w-md">
      <TextH1>🐮 Daimoo</TextH1>
      <div className="h-4" />
      <TextLight>
        This is a Farcaster frame that invites people to Daimo. Want to post
        your own? Email us at{" "}
        <a href="mailto:founders@daimo.com">founders@daimo.com</a>.
      </TextLight>
      <div className="h-4" />
      <pre className="font-mono text-grayMid">
        {JSON.stringify(frame, null, 2)}
      </pre>
    </div>
  );
}
