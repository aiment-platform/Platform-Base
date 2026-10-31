import { AccessToken, TrackSource } from "livekit-server-sdk";
import type { VideoGrant } from "livekit-server-sdk";

export type TokenParams = {
  apiKey: string;
  apiSecret: string;
  roomName: string;
  userId: string;
  userName: string;
};

/**
 * VTuber (host) token: admin rights, but no media publishing from the browser.
 * All audio/video comes from OBS via Ingress, so the browser's real camera and
 * mic are excluded at the token level. canUpdateOwnMetadata lets the host set
 * the "video hidden" attribute that viewers react to (apps/web/app/lib/hostVideo.ts).
 */
export async function createVtuberToken(params: TokenParams): Promise<string> {
  const at = new AccessToken(params.apiKey, params.apiSecret, {
    identity: params.userId,
    name: params.userName,
    ttl: "4h",
  });

  const grant: VideoGrant = {
    room: params.roomName,
    roomJoin: true,
    roomCreate: true,
    roomAdmin: true,
    canPublish: false,
    canSubscribe: true,
    canPublishData: true,
    canUpdateOwnMetadata: true,
  };
  at.addGrant(grant);
  return at.toJwt();
}

/**
 * Speaker token: audio-only publish, can subscribe to VTuber's tracks.
 */
export async function createSpeakerToken(
  params: TokenParams,
): Promise<string> {
  const at = new AccessToken(params.apiKey, params.apiSecret, {
    identity: params.userId,
    name: params.userName,
    ttl: "4h",
  });

  const grant: VideoGrant = {
    room: params.roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    canPublishSources: [TrackSource.MICROPHONE],
  };
  at.addGrant(grant);
  return at.toJwt();
}

/**
 * Listener token: subscribe + data messages only.
 * canPublish is false: an empty canPublishSources means "no restriction" in
 * LiveKit, so it alone would still allow publishing a camera.
 */
export async function createListenerToken(params: TokenParams): Promise<string> {
  const at = new AccessToken(params.apiKey, params.apiSecret, {
    identity: params.userId,
    name: params.userName,
    ttl: "4h",
  });

  const grant: VideoGrant = {
    room: params.roomName,
    roomJoin: true,
    canPublish: false,
    canSubscribe: true,
    canPublishData: true,
  };
  at.addGrant(grant);
  return at.toJwt();
}
