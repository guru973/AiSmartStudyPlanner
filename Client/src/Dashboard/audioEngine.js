/**
 * Procedural Web Audio Engine for Ambient Focus Sounds
 * (No external MP3 assets needed; pure browser synthesis)
 */
let audioCtx = null;
let currentNodes = [];
let masterGain = null;

function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

export function stopAmbientSound() {
    currentNodes.forEach(node => {
        try {
            if (node.stop) node.stop();
            if (node.disconnect) node.disconnect();
        } catch (e) {
            // ignore cleanup errors
        }
    });
    currentNodes = [];
}

export function setAmbientVolume(val) {
    if (masterGain && audioCtx) {
        masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, val)), audioCtx.currentTime);
    }
}

/**
 * Play a synthesized ambient soundscape
 * @param {'binaural' | 'rain' | 'zen'} type
 * @param {number} volume 0 to 1
 */
export function playAmbientSound(type = 'binaural', volume = 0.5) {
    const ctx = getAudioContext();
    stopAmbientSound();

    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, ctx.currentTime);
    masterGain.connect(ctx.destination);

    if (type === 'binaural') {
        // 40Hz Gamma Focus: Carrier 200Hz (Left) & 240Hz (Right)
        const merger = ctx.createChannelMerger(2);

        // Left ear 200 Hz
        const oscL = ctx.createOscillator();
        oscL.type = 'sine';
        oscL.frequency.setValueAtTime(200, ctx.currentTime);

        const gainL = ctx.createGain();
        gainL.gain.setValueAtTime(0.3, ctx.currentTime);
        oscL.connect(gainL);
        gainL.connect(merger, 0, 0);

        // Right ear 240 Hz
        const oscR = ctx.createOscillator();
        oscR.type = 'sine';
        oscR.frequency.setValueAtTime(240, ctx.currentTime);

        const gainR = ctx.createGain();
        gainR.gain.setValueAtTime(0.3, ctx.currentTime);
        oscR.connect(gainR);
        gainR.connect(merger, 0, 1);

        merger.connect(masterGain);

        oscL.start();
        oscR.start();
        currentNodes = [oscL, oscR, gainL, gainR, merger, masterGain];
    } else if (type === 'rain') {
        // Synthesize Pink/Brown Rain Noise
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        // Low-pass filter for cozy rain sensation
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();

        currentNodes = [whiteNoise, filter, masterGain];
    } else if (type === 'zen') {
        // Warm Zen Drone Chord (110Hz, 164.81Hz, 220Hz)
        const freqs = [110, 164.81, 220];
        const oscs = freqs.map(freq => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.18, ctx.currentTime);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start();
            return osc;
        });

        currentNodes = [...oscs, masterGain];
    }
}
