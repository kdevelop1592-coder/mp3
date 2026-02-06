
export const quantizeValue = (value: number, bitDepth: number): number => {
    if (bitDepth >= 32) return value; // No effective quantization for float32 view
    const levels = Math.pow(2, bitDepth);
    const maxVal = levels - 1;

    // Normalize -1..1 to 0..1
    let normalized = (value + 1) / 2;
    // Clamp
    normalized = Math.max(0, Math.min(1, normalized));

    // Quantize
    const discrete = Math.round(normalized * maxVal);

    // Restore
    const quantizedNorm = discrete / maxVal;
    return (quantizedNorm * 2) - 1;
};

export const getQuantizationError = (original: number, quantized: number) => {
    return Math.abs(original - quantized);
};

export const formatBinary = (value: number, bitDepth: number): string => {
    const levels = Math.pow(2, bitDepth);
    const maxVal = levels - 1;
    let normalized = (value + 1) / 2;
    normalized = Math.max(0, Math.min(1, normalized));
    const discrete = Math.round(normalized * maxVal);
    return discrete.toString(2).padStart(bitDepth, '0');
};
