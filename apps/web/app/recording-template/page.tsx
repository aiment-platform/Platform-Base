"use client";

/**
 * 「全部入り」録画の画面（LiveKit の録画用ブラウザが開く。人が見るページではない）。
 *
 * LiveKit は録画を始めるとき、このページを ?url=...&token=... 付きで開き、
 * 画面に映ったものと、ページで鳴っている音をそのまま録る。だから:
 *   - 映像 … OBS から入る VTuber の映像だけを全面に出す（声だけの視聴者の枠は出さない）
 *   - 音   … 部屋の全員分（VTuber＋話した視聴者）を鳴らす
 *   - 配信者が「映像を止める」を入れている間は、映像を出さない（視聴者に見えないものは録らない）
 *
 * ページの準備ができたら console に START_RECORDING、部屋から出たら END_RECORDING を書く。
 * これが LiveKit への「録り始めて／録り終えて」の合図になる。
 */
import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track, type RemoteParticipant, type RemoteTrack } from "livekit-client";
import { isHostVideoHidden, isIngressIdentity } from "../lib/hostVideo";

export default function RecordingTemplatePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioContainerRef = useRef<HTMLDivElement | null>(null);
  const [hidden, setHidden] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("url");
    const token = params.get("token");
    if (!url || !token) return;

    const room = new Room({ adaptiveStream: false, dynacast: false });
    let started = false;

    const syncHidden = () => {
      const anyHidden = Array.from(room.remoteParticipants.values()).some((p) => isHostVideoHidden(p.attributes));
      setHidden(anyHidden);
    };

    const onTrackSubscribed = (track: RemoteTrack, _pub: unknown, participant: RemoteParticipant) => {
      if (track.kind === Track.Kind.Video) {
        if (!isIngressIdentity(participant.identity) || !videoRef.current) return;
        track.attach(videoRef.current);
        setHasVideo(true);
        return;
      }
      if (track.kind === Track.Kind.Audio && audioContainerRef.current) {
        const el = track.attach();
        el.dataset.trackSid = track.sid;
        audioContainerRef.current.appendChild(el);
      }
    };

    const onTrackUnsubscribed = (track: RemoteTrack, _pub: unknown, participant: RemoteParticipant) => {
      if (track.kind === Track.Kind.Video && isIngressIdentity(participant.identity)) setHasVideo(false);
      track.detach().forEach((el) => {
        if (el instanceof HTMLAudioElement) el.remove();
      });
    };

    room
      .on(RoomEvent.TrackSubscribed, onTrackSubscribed)
      .on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed)
      .on(RoomEvent.ParticipantAttributesChanged, syncHidden)
      .on(RoomEvent.ParticipantConnected, syncHidden)
      .on(RoomEvent.ParticipantDisconnected, syncHidden)
      .on(RoomEvent.Disconnected, () => {
        console.log("END_RECORDING");
      });

    void room
      .connect(url, token, { autoSubscribe: true })
      .then(() => {
        syncHidden();
        if (!started) {
          started = true;
          console.log("START_RECORDING");
        }
      })
      .catch((err) => {
        console.error("recording template failed to connect", err);
      });

    return () => {
      void room.disconnect();
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2147483647,
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          visibility: hasVideo && !hidden ? "visible" : "hidden",
        }}
      />
      <div ref={audioContainerRef} style={{ display: "none" }} />
    </div>
  );
}
