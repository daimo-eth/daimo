// Vendored from @coinbase/onchainkit
// MIT License
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

export type FrameButtonMetadata = {
  label: string;
  action?: "post" | "post_redirect" | "link";
  target?: string;
};

type FrameInputMetadata = {
  text: string;
};

export type FrameMetadataType = {
  buttons?: [FrameButtonMetadata, ...FrameButtonMetadata[]];
  image: string;
  input?: FrameInputMetadata;
  post_url?: string;
  refresh_period?: number;
};

type FrameMetadataResponse = Record<string, string>;

/**
 * This function generates the metadata for a Farcaster Frame.
 * @param buttons: The buttons to use for the frame.
 * @param image: The image to use for the frame.
 * @param input: The text input to use for the frame.
 * @param post_url: The URL to post the frame to.
 * @param refresh_period: The refresh period for the image used.
 * @returns The metadata for the frame.
 */
export const getFrameMetadata = function ({
  buttons,
  image,
  input,
  post_url,
  refresh_period,
}: FrameMetadataType): FrameMetadataResponse {
  const metadata: Record<string, string> = {
    "fc:frame": "vNext",
  };
  metadata["fc:frame:image"] = image;
  if (input) {
    metadata["fc:frame:input:text"] = input.text;
  }
  if (buttons) {
    buttons.forEach((button, index) => {
      metadata[`fc:frame:button:${index + 1}`] = button.label;
      if (button.action) {
        metadata[`fc:frame:button:${index + 1}:action`] = button.action;
      }
      if (button.target) {
        metadata[`fc:frame:button:${index + 1}:target`] = button.target;
      }
    });
  }
  if (post_url) {
    metadata["fc:frame:post_url"] = post_url;
  }
  if (refresh_period) {
    metadata["fc:frame:refresh_period"] = refresh_period.toString();
  }
  return metadata;
};

/**
 * Frame Data
 *
 * Note: exported as public Type
 */
export interface FrameData {
  buttonIndex: number;
  castId: {
    fid: number;
    hash: string;
  };
  inputText: string;
  fid: number;
  messageHash: string;
  network: number;
  timestamp: number;
  url: string;
}
/**
 * Frame Request
 *
 * Note: exported as public Type
 */
export interface FrameRequest {
  untrustedData: FrameData;
  trustedData: {
    messageBytes: string;
  };
}

/**
 * Given a frame message, decode and validate it.
 */
export async function getFrameMessage(
  body: FrameRequest,
  neynarClient: NeynarAPIClient
) {
  const { messageBytes } = body.trustedData;
  const response = await neynarClient.validateFrameAction(messageBytes);
  return response;
}

/**
 * Returns an HTML string containing metadata for a new valid frame.
 *
 * @param buttons: The buttons to use for the frame.
 * @param image: The image to use for the frame.
 * @param input: The text input to use for the frame.
 * @param post_url: The URL to post the frame to.
 * @param refresh_period: The refresh period for the image used.
 * @returns An HTML string containing metadata for the frame.
 */
export function getFrameHtmlResponse({
  buttons,
  image,
  input,
  post_url,
  refresh_period,
}: FrameMetadataType): string {
  // Set the image metadata if it exists.
  const imageHtml = image
    ? `<meta property="fc:frame:image" content="${image}" />`
    : "";

  // Set the input metadata if it exists.
  const inputHtml = input
    ? `<meta property="fc:frame:input:text" content="${input.text}" />`
    : "";

  // Set the button metadata if it exists.
  let buttonsHtml = "";
  if (buttons) {
    buttonsHtml = buttons
      .map((button, index) => {
        let buttonHtml = `<meta property="fc:frame:button:${
          index + 1
        }" content="${button.label}" />`;
        if (button.action) {
          buttonHtml += `<meta property="fc:frame:button:${
            index + 1
          }:action" content="${button.action}" />`;
        }
        if (button.target) {
          buttonHtml += `<meta property="fc:frame:button:${
            index + 1
          }:target" content="${button.target}" />`;
        }
        return buttonHtml;
      })
      .join("");
  }

  // Set the post_url metadata if it exists.
  const postUrlHtml = post_url
    ? `<meta property="fc:frame:post_url" content="${post_url}" />`
    : "";

  // Set the refresh_period metadata if it exists.
  const refreshPeriodHtml = refresh_period
    ? `<meta property="fc:frame:refresh_period" content="${refresh_period.toString()}" />`
    : "";

  // Return the HTML string containing all the metadata.
  let html =
    '<!DOCTYPE html><html><head><meta property="fc:frame" content="vNext" />';
  html += `${imageHtml}${inputHtml}${buttonsHtml}${postUrlHtml}${refreshPeriodHtml}</head></html>`;

  return html;
}
