import React, { useState } from 'react';
import { useAudioProcessor } from './hooks/useAudioProcessor';
import WaveformCanvas from './components/WaveformCanvas';
import { quantizeValue } from './utils/audioUtils';
import { Upload, Play, Square, Info, Volume2 } from 'lucide-react';

function App() {
  const { loadFile, audioBuffer, isPlaying, play, stop } = useAudioProcessor();

  // Simulation Parameters
  const [sampleRateCtx, setSampleRateCtx] = useState(5000);
  const [bitDepth, setBitDepth] = useState(4);

  // Visualization Parameters
  const [zoom, setZoom] = useState(50);
  const [showAnalog, setShowAnalog] = useState(true);
  const [showSampling, setShowSampling] = useState(true);
  const [showQuantization, setShowQuantization] = useState(true);
  const [showError, setShowError] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadFile(e.target.files[0]);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1 className="title">Digital Audio Visualizer</h1>
            <p className="subtitle">Visualize Pulse Code Modulation (PCM): Sampling, Quantization, and Encoding</p>
          </div>
          <a href="https://github.com/google-deepmind/audio-viz" target="_blank" className="info-link">
            <Info size={24} />
          </a>
        </div>
      </header>

      <main className="main-layout">

        {/* Left Column */}
        <div className="sidebar">

          <div className="card">
            <h2 className="card-title"><Upload size={20} /> Source</h2>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="file-input"
            />
          </div>

          <div className="card">
            <h2 className="card-title"><Volume2 size={20} /> PCM Parameters</h2>

            <div className="control-group">
              <div className="control-label">
                <label>Sampling Rate</label>
                <span className="value-badge">{sampleRateCtx} Hz</span>
              </div>
              <input
                type="range"
                min="100"
                max="44100"
                step="100"
                value={sampleRateCtx}
                onChange={(e) => setSampleRateCtx(Number(e.target.value))}
                className="slider"
              />
              <p className="control-hint">Determines time resolution</p>
            </div>

            <div className="control-group">
              <div className="control-label">
                <label>Bit Depth</label>
                <span className="value-badge bit-badge">{bitDepth} Bits</span>
              </div>
              <input
                type="range"
                min="1"
                max="16"
                step="1"
                value={bitDepth}
                onChange={(e) => setBitDepth(Number(e.target.value))}
                className="slider"
              />
              <div className="range-labels">
                <span>2 Levels</span>
                <span>{Math.pow(2, bitDepth)} Levels</span>
                <span>65536</span>
              </div>
            </div>

            <div className="button-group">
              <button
                onClick={isPlaying ? stop : play}
                disabled={!audioBuffer}
                className={`btn ${isPlaying ? 'btn-stop' : 'btn-play'} ${!audioBuffer ? 'btn-disabled' : ''}`}
              >
                {isPlaying ? <><Square size={18} fill="currentColor" /> Stop Preview</> : <><Play size={18} fill="currentColor" /> Play Audio</>}
              </button>
            </div>
            <p className="note">Note: Preview uses simulated degradation.</p>
          </div>

        </div>

        {/* Right Column */}
        <div className="content-area">

          <div className="visualizer-card">
            <div className="visualizer-controls">
              <label><input type="checkbox" checked={showAnalog} onChange={e => setShowAnalog(e.target.checked)} /> <span>Analog</span></label>
              <label><input type="checkbox" checked={showSampling} onChange={e => setShowSampling(e.target.checked)} /> <span>Sampling</span></label>
              <label><input type="checkbox" checked={showQuantization} onChange={e => setShowQuantization(e.target.checked)} /> <span>Quantization</span></label>
              <label><input type="checkbox" checked={showError} onChange={e => setShowError(e.target.checked)} /> <span>Error</span></label>
            </div>

            <div className="zoom-control">
              <span>Zoom</span>
              <input
                type="range" min="1" max="500" value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
              />
            </div>

            <div className="canvas-wrapper">
              <WaveformCanvas
                audioBuffer={audioBuffer}
                sampleRateCtx={sampleRateCtx}
                bitDepth={bitDepth}
                zoom={zoom}
                showAnalog={showAnalog}
                showSampling={showSampling}
                showQuantization={showQuantization}
                showError={showError}
                width={800}
                height={400}
              />
            </div>
          </div>

          <div className="card table-card">
            <h3 className="card-title">Encoding Data Preview</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Index</th>
                    <th>Time (s)</th>
                    <th>Original</th>
                    <th>Quantized</th>
                    <th>Binary</th>
                  </tr>
                </thead>
                <tbody>
                  {audioBuffer ? Array.from({ length: 20 }).map((_, i) => {
                    const data = audioBuffer.getChannelData(0);
                    const realRate = audioBuffer.sampleRate;
                    const skip = Math.max(1, Math.floor(realRate / sampleRateCtx));
                    const idx = i * skip;

                    if (idx >= data.length) return null;

                    const val = data[idx];
                    const quantized = quantizeValue(val, bitDepth);
                    const levels = Math.pow(2, bitDepth);
                    const normalized = (quantized + 1) / 2;
                    const integerVal = Math.round(normalized * (levels - 1));

                    return (
                      <tr key={i}>
                        <td>{i}</td>
                        <td>{(idx / realRate).toFixed(6)}s</td>
                        <td>{val.toFixed(4)}</td>
                        <td className="highlight-amber">{quantized.toFixed(4)}</td>
                        <td className="font-mono highlight-blue">
                          {integerVal.toString(2).padStart(bitDepth, '0')}
                        </td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <td colSpan={5} className="empty-message">
                        Upload audio to see data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
