import React, { useRef, useEffect } from 'react';
import { quantizeValue } from '../utils/audioUtils';

interface WaveformCanvasProps {
    audioBuffer: AudioBuffer | null;
    sampleRateCtx: number; // The visual "sample rate" (how many points we decimate to)
    bitDepth: number; // 1 to 16+
    zoom: number; // Zoom level to see details
    showAnalog?: boolean;
    showSampling?: boolean;
    showQuantization?: boolean;
    showError?: boolean;
    width?: number;
    height?: number;
}

const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
    audioBuffer,
    sampleRateCtx,
    bitDepth,
    zoom,
    showAnalog = true,
    showSampling = true,
    showQuantization = true,
    showError = false,
    width = 800,
    height = 400
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#1e293b'; // Slate 800
        ctx.fillRect(0, 0, width, height);

        if (!audioBuffer) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Upload an audio file to start', width / 2, height / 2);
            return;
        }

        const data = audioBuffer.getChannelData(0); // Left channel
        // We visualize a small window based on zoom.
        // Center of the window? Or just start? Let's say we show the first N samples for now,
        // or we can add a 'timeOffset' prop later.
        const timeOffset = 0;
        const windowSize = Math.floor(data.length / zoom);
        // For educational visualization, we need to see individual "analog" samples vs "digital" samples.
        // If zoom is high, we draw lines.

        // Draw Grid (Quantization Levels)
        if (showQuantization && bitDepth <= 5) { // Only show grid if bitDepth is low enough to be visible
            const levels = Math.pow(2, bitDepth);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i <= levels; i++) {
                const y = height - (i / levels) * height;
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
            }
            ctx.stroke();
        }

        // Draw Zero line
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        const ampToY = (amp: number) => {
            // amp is -1 to 1.
            // y: 1 -> 0, -1 -> height
            return height / 2 - (amp * height / 2);
        };

        // Draw Analog (Approximated by high-res original data)
        if (showAnalog) {
            ctx.strokeStyle = '#22c55e'; // Green
            ctx.lineWidth = 2;
            ctx.beginPath();

            // Draw visible window
            // To simulate "Analog", we draw the original high-res data smoothly.
            const sliceWidth = width * 1.0 / (windowSize);
            let x = 0;

            // Limit drawing for performance if zoomed out
            const drawStep = Math.max(1, Math.floor(windowSize / 2000));

            for (let i = 0; i < windowSize; i += drawStep) {
                const idx = Math.floor(timeOffset + i);
                if (idx >= data.length) break;

                const v = data[idx];
                const y = ampToY(v);

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);

                x += sliceWidth * drawStep;
            }
            ctx.stroke();
        }

        // Draw Quantized / Sampled
        // To simulate sampling rate, we only pick samples every K real samples.
        // audioBuffer.sampleRate is e.g. 44100 or 48000.
        // sampleRateCtx might be 1000 Hz.
        // Skip = realRate / targetRate.
        const realRate = audioBuffer.sampleRate;
        const skip = Math.max(1, realRate / sampleRateCtx);

        if (showSampling || showQuantization) {
            // Points
            const sliceWidth = width * 1.0 / (windowSize);

            // Draw "Sticks" or "Points"
            for (let i = 0; i < windowSize; i += skip) {
                const idx = Math.floor(timeOffset + i);
                if (idx >= data.length) break;

                const originalVal = data[idx];
                // Quantize this value
                const finalVal = showQuantization ? quantizeValue(originalVal, bitDepth) : originalVal;

                const x = i * sliceWidth;
                const y = ampToY(finalVal);

                // Draw Sample Line (Stick)
                if (showSampling) {
                    ctx.strokeStyle = '#3b82f6'; // Blue
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, height / 2);
                    ctx.lineTo(x, y);
                    ctx.stroke();

                    // Dot
                    ctx.fillStyle = '#60a5fa';
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Draw Step (Sample & Hold)
                if (showQuantization) {
                    const nextI = i + skip;
                    const nextX = Math.min(width, nextI * sliceWidth);

                    ctx.strokeStyle = '#f59e0b'; // Amber
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(nextX, y); // Hold
                    // Usually we don't draw vertical drop here for pure S&H visualization, 
                    // or we do to make it look like a staircase. Let's draw it detached or connected?
                    // Connected looks better for "digital signal reconstruction".
                    if (windowSize < 1000) { // Only if zoomed in enough
                        // check next value to draw vertical line?
                        // Actually, just drawing the hold line is enough for "PAM/PCM" visualization usually.
                    }
                    ctx.stroke();
                }

                // Draw Error
                if (showError) {
                    const originalY = ampToY(originalVal);
                    ctx.strokeStyle = '#ef4444'; // Red
                    ctx.beginPath();
                    ctx.moveTo(x, originalY);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }
            }
        }

    }, [audioBuffer, sampleRateCtx, bitDepth, zoom, showAnalog, showSampling, showQuantization, showError, width, height]);

    return <canvas ref={canvasRef} width={width} height={height} className="border border-slate-700 rounded-lg bg-slate-900 shadow-xl" />;
};

export default WaveformCanvas;
