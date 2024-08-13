import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TextH1, TextLight } from "../../../components/typography";
import { getAbsoluteUrl } from "../../../utils/getAbsoluteUrl";
import { inviteFrameLinks } from "../frameLink";
import { getFrameLinkServiceFromEnv } from "../frameLinkService";
import { getFrameMetadata } from "../frameUtils";

interface LinkProps {
  params: { frameId: string };
}

export async function generateMetadata(props: LinkProps): Promise<Metadata> {
  // Load the frame we're showing
  const service = getFrameLinkServiceFromEnv();
  const frame = await service.loadFrame(Number(props.params.frameId));
  if (frame == null) {
    throw notFound();
  }

  // Show image, button text customized to this invite frame
  const frameMetadata = getFrameMetadata({
    buttons: [
      {
        label: frame.appearance.buttonInit,
      },
    ],
    image: getAbsoluteUrl(frame.appearance.imgInit),
    post_url: getAbsoluteUrl(`/frame/${props.params.frameId}/callback`),
  });

  const metadata: Metadata = {
    title: "Daimo Invite Frame",
    description: "Fast payments, self custody, open source, one-tap invites.",
    openGraph: {
      title: "Daimo Invite Frame",
      description: "Fast payments, self custody, one-tap invites.",
      images: [getAbsoluteUrl(frame.appearance.imgInit)],
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
      <TextH1>✳️ Daimo Invite Frame</TextH1>
      <div className="h-4" />
      <TextLight>
        This is a Farcaster frame that invites people to Daimo. Want to post
        your own, customized invite frame? Email us at{" "}
        <a href="mailto:founders@daimo.com">founders@daimo.com</a>.
      </TextLight>
      <div className="h-4" />
      <pre className="font-mono text-grayMid">
        {frame == null && `Invite Frame ${frameId} not found`}
        {frame && JSON.stringify(frame, null, 2)}
      </pre>
    </div>
  );
}
