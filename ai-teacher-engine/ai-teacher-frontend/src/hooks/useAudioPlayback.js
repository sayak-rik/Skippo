import { useCallback, useEffect, useRef } from "react";

/**
 * Handles playback of base64-encoded MP3 audio chunks from edge-tts.
 * Single audio element with object-URL swapping; cleans up on unmount.
 */
const useAudioPlayback = (onPlaybackComplete) => {
  const audioRef = useRef(null);
  const onCompleteRef = useRef(onPlaybackComplete);
  const pendingRef = useRef(null); // blob URL waiting to play

  useEffect(() => { onCompleteRef.current = onPlaybackComplete; }, [onPlaybackComplete]);

  const play = useCallback((base64Audio, format = "mp3") => {
    if (!base64Audio) return;

    // Decode base64 → Uint8Array → Blob → object URL
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const mimeType = format === "mp3" ? "audio/mpeg" : "audio/wav";
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);

    // Stop any in-progress audio
    if (audioRef.current) {
      audioRef.current.pause();
      if (pendingRef.current) URL.revokeObjectURL(pendingRef.current);
    }

    const audio = new Audio(url);
    pendingRef.current = url;
    audioRef.current = audio;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      pendingRef.current = null;
      onCompleteRef.current?.();
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      pendingRef.current = null;
      onCompleteRef.current?.();
    };

    audio.play().catch(() => {
      URL.revokeObjectURL(url);
      pendingRef.current = null;
      onCompleteRef.current?.();
    });
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (pendingRef.current) {
      URL.revokeObjectURL(pendingRef.current);
      pendingRef.current = null;
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { play, stop };
};

export default useAudioPlayback;
