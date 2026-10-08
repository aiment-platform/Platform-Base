import { RoomServiceClient } from "livekit-server-sdk";

export type RoomParams = {
  apiKey: string;
  apiSecret: string;
  host: string;
  roomName: string;
  maxParticipants?: number;
  emptyTimeoutSeconds?: number;
};

/**
 * Create or ensure a LiveKit room exists.
 * Default: 6 participants (VTuber + 5 speakers), 5 min empty timeout.
 */
export async function ensureRoomExists(params: RoomParams): Promise<void> {
  const client = new RoomServiceClient(
    params.host,
    params.apiKey,
    params.apiSecret,
  );

  await client.createRoom({
    name: params.roomName,
    maxParticipants: params.maxParticipants ?? 6,
    emptyTimeout: params.emptyTimeoutSeconds ?? 300,
  });
}

export type DeleteRoomParams = {
  apiKey: string;
  apiSecret: string;
  host: string;
  roomName: string;
};

/**
 * Close a LiveKit room, disconnecting every participant (browser publishers, OBS ingress, viewers).
 * Resolves silently when the room does not exist.
 */
export async function deleteRoom(params: DeleteRoomParams): Promise<void> {
  const client = new RoomServiceClient(
    params.host.replace(/^wss?:\/\//, "https://"),
    params.apiKey,
    params.apiSecret,
  );
  try {
    await client.deleteRoom(params.roomName);
  } catch (err) {
    // A missing room (nobody connected) is expected; TwirpError carries status/code
    const { status, code } = (err ?? {}) as { status?: number; code?: string };
    if (status !== 404 && code !== "not_found") throw err;
  }
}
