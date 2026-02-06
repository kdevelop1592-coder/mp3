import { useState, useRef, useEffect, useCallback } from 'react';

export function useAudioProcessor() {
  const [audioContext] = useState(() => new (window.AudioContext || (window as any).webkitAudioContext)());
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    return () => {
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [audioContext]);

  const loadFile = useCallback(async (file: File) => {
    if (!file) return;
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
      setAudioBuffer(decodedBuffer);
    } catch (error) {
      console.error("Error decoding audio data:", error);
    }
  }, [audioContext]);

  const play = useCallback(() => {
    if (!audioBuffer) return;
    
    // Stop previous instance if any
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
    sourceNodeRef.current = source;
    setIsPlaying(true);

    source.onended = () => setIsPlaying(false);
  }, [audioContext, audioBuffer]);

  const stop = useCallback(() => {
    if (sourceNodeRef.current) {
        try {
            sourceNodeRef.current.stop();
        } catch (e) {
            // ignore
        }
      setIsPlaying(false);
    }
  }, []);

  return {
    loadFile,
    audioBuffer,
    isPlaying,
    play,
    stop,
    audioContext
  };
}
