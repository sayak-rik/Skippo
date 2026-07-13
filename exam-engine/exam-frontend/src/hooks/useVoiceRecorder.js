import { useRef, useState, useCallback, useEffect } from "react";
export function useVoiceRecorder({ onAudioChunk, onStop }) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const mediaRecorder = useRef(null);
    const streamRef = useRef(null);
    const currentQuestionId = useRef("");
    // Listen for transcript events from useTestWebSocket
    useEffect(() => {
        const handler = (e) => {
            const detail = e.detail;
            if (detail.questionId === currentQuestionId.current) {
                setTranscript(detail.text ?? "");
            }
        };
        window.addEventListener("exam:transcript", handler);
        return () => window.removeEventListener("exam:transcript", handler);
    }, []);
    const startRecording = useCallback(async (questionId) => {
        setTranscript("");
        currentQuestionId.current = questionId;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const mr = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
            mediaRecorder.current = mr;
            mr.ondataavailable = async (evt) => {
                if (evt.data.size > 0) {
                    const buf = await evt.data.arrayBuffer();
                    onAudioChunk(buf);
                }
            };
            mr.start(250); // send chunks every 250ms
            setIsRecording(true);
        }
        catch {
            // mic permission denied — fall back to text
        }
    }, [onAudioChunk]);
    const stopRecording = useCallback(() => {
        mediaRecorder.current?.stop();
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        onStop(currentQuestionId.current);
    }, [onStop]);
    return { isRecording, transcript, startRecording, stopRecording, setTranscript };
}
