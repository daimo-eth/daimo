import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { TextH1, TextLight } from "../../../components/typography";
import { getI18N } from "../../../i18n";
import { useI18N } from "../../../i18n/context";
import { getAbsoluteUrl } from "../../../utils/getAbsoluteUrl";
import { inviteFrameLinks } from "../frameLink";
import { getFrameLinkServiceFromEnv } from "../frameLinkService";
import { getFrameMetadata } from "../frameUtils";

interface LinkProps {
  params: { frameId: string };
}

export async function generateMetadata(props: LinkProps): Promise<Metadata> {
  const i18n = getI18N(headers().get("accept-language"));
  const i18 = i18n.frame.invite.metadata; // reuse from other

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
    title: i18.title(),
    description: i18.description(),
    openGraph: {
      title: i18.openGraph.title(),
      description: i18.openGraph.description(),
      images: [getAbsoluteUrl(frame.appearance.imgInit)],
    },
    other: {
      ...frameMetadata,
    },
  };

  return metadata;
}

export default function Page({ params }: LinkProps) {
  const i18n = useI18N();
  const i18 = i18n.frame.callback;

  const frameId = Number(params.frameId);
  const frame = inviteFrameLinks.find((l) => l.id === frameId);
  return (
    <div className="p-4 max-w-md">
      <TextH1>{i18.DaimoInviteFrame()}</TextH1>
      <div className="h-4" />
      <TextLight>
        {i18.text()}
        <a href="mailto:founders@daimo.com">founders@daimo.com</a>.
      </TextLight>
      <div className="h-4" />
      <pre className="font-mono text-grayMid">
        {frame == null && i18.inviteFrameNotFound(frameId)}
        {frame && JSON.stringify(frame, null, 2)}
      </pre>
    </div>
  );
}
