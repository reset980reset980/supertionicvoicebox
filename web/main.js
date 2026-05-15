import {
    loadTextToSpeech,
    loadVoiceStyle,
    writeWavFile
} from './helper.js';

// Configuration
const DEFAULT_VOICE_STYLE_PATH = 'assets/voice_styles/M1.json';

// Helper function to extract filename from path
function getFilenameFromPath(path) {
    return path.split('/').pop();
}

// Global state
let textToSpeech = null;
let cfgs = null;
let activeBackend = '로딩 중';
let runHistory = [];
let voiceboxConnected = false;
let voiceboxHealth = null;
let voiceboxProfiles = [];
let voiceboxPresetVoices = [];
let micRecorder = null;
let micRecordChunks = [];
let recordedSttBlob = null;
let micAudioContext = null;
let micAnalyser = null;
let micLevelTimer = null;
let micRecordStartedAt = 0;

// Pre-computed style
let currentStyle = null;
let currentStylePath = DEFAULT_VOICE_STYLE_PATH;

// UI Elements
const textInput = document.getElementById('text');
const voiceStyleSelect = document.getElementById('voiceStyleSelect');
const voiceStyleInfo = document.getElementById('voiceStyleInfo');
const langSelect = document.getElementById('langSelect');
const totalStepInput = document.getElementById('totalStep');
const speedInput = document.getElementById('speed');
const effectPresetSelect = document.getElementById('effectPreset');
const benchmarkRepeatsInput = document.getElementById('benchmarkRepeats');
const generateBtn = document.getElementById('generateBtn');
const benchmarkBtn = document.getElementById('benchmarkBtn');
const voiceboxBaseUrlInput = document.getElementById('voiceboxBaseUrl');
const voiceboxConnectBtn = document.getElementById('voiceboxConnectBtn');
const voiceboxStatus = document.getElementById('voiceboxStatus');
const voiceboxProfileSelect = document.getElementById('voiceboxProfileSelect');
const voiceboxEngineSelect = document.getElementById('voiceboxEngineSelect');
const voiceboxLanguageSelect = document.getElementById('voiceboxLanguageSelect');
const voiceboxPersonalityInput = document.getElementById('voiceboxPersonality');
const voiceboxSpeakBtn = document.getElementById('voiceboxSpeakBtn');
const compareBothBtn = document.getElementById('compareBothBtn');
const presetEngineSelect = document.getElementById('presetEngineSelect');
const presetVoiceSelect = document.getElementById('presetVoiceSelect');
const presetProfileNameInput = document.getElementById('presetProfileName');
const presetProfileLanguageSelect = document.getElementById('presetProfileLanguage');
const createPresetProfileBtn = document.getElementById('createPresetProfileBtn');
const cloneProfileNameInput = document.getElementById('cloneProfileName');
const cloneProfileLanguageSelect = document.getElementById('cloneProfileLanguage');
const cloneSampleFileInput = document.getElementById('cloneSampleFile');
const cloneReferenceTextInput = document.getElementById('cloneReferenceText');
const createCloneProfileBtn = document.getElementById('createCloneProfileBtn');
const sttLanguageSelect = document.getElementById('sttLanguageSelect');
const sttModelSelect = document.getElementById('sttModelSelect');
const sttAudioFileInput = document.getElementById('sttAudioFile');
const micDeviceSelect = document.getElementById('micDeviceSelect');
const startMicRecordBtn = document.getElementById('startMicRecordBtn');
const stopMicRecordBtn = document.getElementById('stopMicRecordBtn');
const micRecordMonitor = document.getElementById('micRecordMonitor');
const micRecordState = document.getElementById('micRecordState');
const micRecordTime = document.getElementById('micRecordTime');
const micRecordLevelBar = document.getElementById('micRecordLevelBar');
const micRecordLevelText = document.getElementById('micRecordLevelText');
const micRecordStatus = document.getElementById('micRecordStatus');
const micRecordPreview = document.getElementById('micRecordPreview');
const transcribeBtn = document.getElementById('transcribeBtn');
const refreshVoiceboxStatusBtn = document.getElementById('refreshVoiceboxStatusBtn');
const loadEffectsBtn = document.getElementById('loadEffectsBtn');
const voiceboxToolOutput = document.getElementById('voiceboxToolOutput');
const statusBox = document.getElementById('statusBox');
const statusText = document.getElementById('statusText');
const backendBadge = document.getElementById('backendBadge');
const resultsContainer = document.getElementById('results');
const errorBox = document.getElementById('error');
const bestRtfEl = document.getElementById('bestRtf');
const runCountEl = document.getElementById('runCount');
const headerBackendEl = document.getElementById('headerBackend');
const lastRtfEl = document.getElementById('lastRtf');
const lastGenerationTimeEl = document.getElementById('lastGenerationTime');
const lastAudioDurationEl = document.getElementById('lastAudioDuration');
const lastThroughputEl = document.getElementById('lastThroughput');
const historyTableBody = document.getElementById('historyTableBody');
const supertonicFeatureCoverage = document.getElementById('supertonicFeatureCoverage');
const voiceboxFeatureCoverage = document.getElementById('voiceboxFeatureCoverage');

const SUPERTONIC_FEATURES = [
    { name: 'ONNX TTS 생성', status: '실행 가능', tone: 'actual', detail: '현재 브라우저에서 실제로 로드하고 합성하는 Supertonic 핵심 기능입니다.' },
    { name: '31개 언어', status: '실행 가능', tone: 'actual', detail: '언어 선택값이 Supertonic 텍스트 전처리와 합성에 직접 사용됩니다.' },
    { name: '10개 음색 스타일', status: '실행 가능', tone: 'actual', detail: 'M1-M5, F1-F5 사전 제작 음색 스타일 JSON을 실제로 로드합니다.' },
    { name: '긴 문장 분할', status: '실행 가능', tone: 'actual', detail: 'helper의 chunking 경로가 긴 입력을 나누어 합성합니다.' },
    { name: '성능 측정', status: '대시보드 기능', tone: 'dashboard', detail: 'RTF, 생성 시간, 처리량, 백엔드 기록을 이 화면에서 측정합니다.' },
    { name: '반복 벤치마크', status: '대시보드 기능', tone: 'dashboard', detail: '같은 입력을 연속 실행해 실행 기록을 비교합니다.' }
];

function getVoiceboxFeatures() {
    const connectedTone = voiceboxConnected ? 'actual' : 'reference';
    const connectedStatus = voiceboxConnected ? '연결됨' : '연결 필요';
    const runnableStatus = voiceboxConnected ? '실행 가능' : '서버 필요';

    return [
        { name: '로컬 서버 연결', status: connectedStatus, tone: connectedTone, detail: 'Voicebox backend의 /health, /profiles API에 연결해 상태와 프로필을 불러옵니다.' },
        { name: '프로필 TTS', status: runnableStatus, tone: connectedTone, detail: '선택한 Voicebox 프로필로 /speak를 호출하고 /audio/{id} 결과를 재생합니다.' },
        { name: '다중 TTS 엔진', status: runnableStatus, tone: connectedTone, detail: 'Qwen, LuxTTS, Chatterbox, TADA, Kokoro 엔진 선택값을 Voicebox 요청에 전달합니다.' },
        { name: '성능 비교', status: '대시보드 기능', tone: 'dashboard', detail: 'Voicebox 생성 시간, 오디오 길이, RTF, 글자/s를 Supertonic 기록과 같은 표에 저장합니다.' },
        { name: 'STT 받아쓰기', status: runnableStatus, tone: connectedTone, detail: '오디오 파일을 /transcribe로 전송하고 Whisper 결과 텍스트를 표시합니다.' },
        { name: '음성복제 샘플', status: runnableStatus, tone: connectedTone, detail: '복제 프로필을 만들고 참조 음성 파일을 /profiles/{id}/samples에 등록합니다.' },
        { name: '오디오 이펙트', status: runnableStatus, tone: connectedTone, detail: 'Voicebox의 사용 가능한 이펙트와 프리셋 목록을 불러옵니다.' }
    ];
}

function escapeHTML(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function renderFeatureGroup(target, features) {
    target.innerHTML = features.map(feature => {
        return `
            <div class="feature-item ${feature.tone}">
                <div class="feature-name">${feature.name}</div>
                <div class="feature-status">${feature.status}</div>
                <p>${feature.detail}</p>
            </div>
        `;
    }).join('');
}

function renderFeatureCoverage() {
    renderFeatureGroup(supertonicFeatureCoverage, SUPERTONIC_FEATURES);
    renderFeatureGroup(voiceboxFeatureCoverage, getVoiceboxFeatures());
}

function getEffectPresetLabel(preset) {
    return {
        clean: '원본',
        radio: '라디오',
        deep: '낮은 목소리',
        bright: '밝게'
    }[preset] || preset;
}

function updateMetrics(summary = null) {
    runCountEl.textContent = String(runHistory.length);
    headerBackendEl.textContent = summary?.backend || activeBackend;

    if (!runHistory.length) {
        bestRtfEl.textContent = '-';
        return;
    }

    const bestRun = runHistory.reduce((best, run) => run.rtf < best.rtf ? run : best, runHistory[0]);
    bestRtfEl.textContent = bestRun.rtf.toFixed(2);

    const latest = summary || runHistory[runHistory.length - 1];
    lastRtfEl.textContent = latest.rtf.toFixed(2);
    lastGenerationTimeEl.textContent = `${latest.generationTimeSec.toFixed(2)}s`;
    lastAudioDurationEl.textContent = `${latest.audioDurationSec.toFixed(2)}s`;
    lastThroughputEl.textContent = `${latest.charsPerSec.toFixed(1)}/s`;
}

function normalizeBaseUrl(url) {
    return url.trim().replace(/\/+$/, '');
}

function setVoiceboxStatus(message, type = 'info') {
    voiceboxStatus.textContent = message;
    voiceboxStatus.className = `panel-note ${type}`;
}

async function readJsonResponse(response, label, baseUrl = '') {
    const contentType = response.headers.get('content-type') || '';
    const bodyText = await response.text();

    if (!response.ok) {
        if (baseUrl.startsWith('/voicebox-api') && response.status === 500 && !bodyText.trim()) {
            throw new Error('Voicebox 백엔드가 실행 중이 아닙니다. 127.0.0.1:17493에서 Voicebox 서버를 먼저 시작하세요.');
        }
        throw new Error(`${label} 실패 (${response.status}): ${bodyText.slice(0, 180)}`);
    }

    if (!contentType.includes('application/json')) {
        throw new Error(`${label} 응답이 JSON이 아닙니다. Voicebox 서버 URL을 확인하세요.`);
    }

    return JSON.parse(bodyText);
}

async function voiceboxJson(path, options = {}) {
    const baseUrl = normalizeBaseUrl(voiceboxBaseUrlInput.value);
    if (!baseUrl) {
        throw new Error('Voicebox 서버 URL을 입력하세요.');
    }

    let response;
    try {
        response = await fetch(`${baseUrl}${path}`, {
            ...options,
            headers: {
                'Accept': 'application/json',
                ...(options.body ? { 'Content-Type': 'application/json' } : {}),
                ...(options.headers || {})
            }
        });
    } catch (error) {
        throw new Error(`Voicebox 서버에 연결할 수 없습니다. ${baseUrl} 대상 서버가 실행 중인지 확인하세요. (${error.message})`);
    }

    return readJsonResponse(response, path, baseUrl);
}

async function voiceboxForm(path, formData) {
    const baseUrl = normalizeBaseUrl(voiceboxBaseUrlInput.value);
    if (!baseUrl) {
        throw new Error('Voicebox 서버 URL을 입력하세요.');
    }

    let response;
    try {
        response = await fetch(`${baseUrl}${path}`, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });
    } catch (error) {
        throw new Error(`Voicebox 서버에 연결할 수 없습니다. ${baseUrl} 대상 서버가 실행 중인지 확인하세요. (${error.message})`);
    }

    return readJsonResponse(response, path, baseUrl);
}

function getVoiceboxBackendLabel() {
    if (!voiceboxHealth) {
        return 'Voicebox API';
    }

    const type = voiceboxHealth.backend_variant || voiceboxHealth.backend_type || 'API';
    const gpu = voiceboxHealth.gpu_available ? (voiceboxHealth.gpu_type || 'GPU') : 'CPU';
    return `Voicebox ${type} ${gpu}`;
}

function getVoiceboxProfileLabel(profile) {
    if (!profile) return '기본 프로필';

    const parts = [profile.name || profile.id];
    if (profile.language) parts.push(profile.language);
    if (profile.voice_type) parts.push(profile.voice_type);
    if (profile.default_engine || profile.preset_engine) {
        parts.push(profile.default_engine || profile.preset_engine);
    }

    return parts.filter(Boolean).join(' · ');
}

function setVoiceboxToolsEnabled(enabled) {
    [
        createPresetProfileBtn,
        createCloneProfileBtn,
        refreshVoiceboxStatusBtn,
        loadEffectsBtn,
        presetEngineSelect,
        presetVoiceSelect
    ].forEach(element => {
        if (element) element.disabled = !enabled;
    });
    if (startMicRecordBtn) startMicRecordBtn.disabled = !window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder;
    if (stopMicRecordBtn) stopMicRecordBtn.disabled = true;
    updateTranscribeButtonState();
}

function hasSttAudioSource() {
    return Boolean(recordedSttBlob?.size || sttAudioFileInput.files?.[0]);
}

function updateTranscribeButtonState() {
    if (!transcribeBtn) return;

    const isRecording = micRecorder?.state === 'recording';
    transcribeBtn.disabled = !hasSttAudioSource() || isRecording;
    if (!hasSttAudioSource()) {
        transcribeBtn.title = '오디오 파일을 선택하거나 마이크 녹음을 완료하세요.';
    } else if (isRecording) {
        transcribeBtn.title = '녹음을 정지한 뒤 전사할 수 있습니다.';
    } else if (!voiceboxConnected) {
        transcribeBtn.title = 'Voicebox 서버에 자동 연결한 뒤 전사합니다.';
    } else {
        transcribeBtn.title = '준비된 오디오를 STT로 전사합니다.';
    }
}

function initializeMicControls() {
    const supported = window.isSecureContext && navigator.mediaDevices?.getUserMedia && window.MediaRecorder;
    startMicRecordBtn.disabled = !supported;
    stopMicRecordBtn.disabled = true;

    if (!window.isSecureContext) {
        micRecordStatus.textContent = '마이크 녹음은 localhost 또는 HTTPS에서만 사용할 수 있습니다.';
    } else if (!supported) {
        micRecordStatus.textContent = '이 브라우저는 마이크 녹음을 지원하지 않습니다.';
    } else {
        micRecordStatus.textContent = '녹음하거나 오디오 파일을 선택하세요.';
    }
    updateMicMonitor();
    refreshMicDevices();
}

function getSupportedRecordingMimeType() {
    const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
    ];

    return candidates.find(type => MediaRecorder.isTypeSupported(type)) || '';
}

function updateMicMonitor({ state = '대기 중', seconds = 0, level = 0, recording = false } = {}) {
    const safeLevel = Math.max(0, Math.min(100, Math.round(level)));
    micRecordState.textContent = state;
    micRecordTime.textContent = `${Number(seconds).toFixed(1)}s`;
    micRecordLevelText.textContent = `입력 레벨 ${safeLevel}%`;
    micRecordLevelBar.style.width = `${safeLevel}%`;
    micRecordMonitor.classList.toggle('recording', recording);
    micRecordMonitor.classList.toggle('silent', recording && safeLevel < 3);
}

async function refreshMicDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        const selectedDevice = micDeviceSelect.value;
        micDeviceSelect.replaceChildren(new Option('기본 마이크', ''));
        audioInputs.forEach((device, index) => {
            const label = device.label || `마이크 ${index + 1}`;
            micDeviceSelect.add(new Option(label, device.deviceId));
        });
        if ([...micDeviceSelect.options].some(option => option.value === selectedDevice)) {
            micDeviceSelect.value = selectedDevice;
        }
    } catch (error) {
        micRecordStatus.textContent = `녹음 장치 목록을 읽지 못했습니다: ${error.message}`;
    }
}

function stopMicLevelMeter() {
    if (micLevelTimer) {
        clearInterval(micLevelTimer);
        micLevelTimer = null;
    }
    if (micAudioContext) {
        micAudioContext.close().catch(() => {});
        micAudioContext = null;
    }
    micAnalyser = null;
}

function startMicLevelMeter(stream) {
    stopMicLevelMeter();
    micAudioContext = new AudioContext();
    const source = micAudioContext.createMediaStreamSource(stream);
    micAnalyser = micAudioContext.createAnalyser();
    micAnalyser.fftSize = 1024;
    source.connect(micAnalyser);

    const samples = new Uint8Array(micAnalyser.fftSize);
    micLevelTimer = setInterval(() => {
        if (!micAnalyser || !micRecorder || micRecorder.state !== 'recording') return;

        micAnalyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (const sample of samples) {
            const centered = sample - 128;
            sum += centered * centered;
        }
        const rms = Math.sqrt(sum / samples.length) / 128;
        const level = Math.min(100, Math.round(rms * 180));
        const elapsed = ((performance.now() - micRecordStartedAt) / 1000).toFixed(1);
        updateMicMonitor({ state: level < 3 ? '녹음 중 · 입력 낮음' : '녹음 중', seconds: Number(elapsed), level, recording: true });
        micRecordStatus.textContent = `녹음 중 · ${elapsed}s · 입력 레벨 ${level}%`;
    }, 250);
}

function renderToolOutput(title, rows) {
    const content = Array.isArray(rows)
        ? rows.map(row => `<div>${row}</div>`).join('')
        : escapeHTML(String(rows));

    voiceboxToolOutput.innerHTML = `
        <div class="tool-output-title">${escapeHTML(title)}</div>
        <div class="tool-output-body">${content}</div>
    `;
}

function renderJsonOutput(title, value) {
    voiceboxToolOutput.innerHTML = `
        <div class="tool-output-title">${escapeHTML(title)}</div>
        <pre>${escapeHTML(JSON.stringify(value, null, 2))}</pre>
    `;
}

async function refreshVoiceboxProfiles() {
    voiceboxProfiles = await voiceboxJson('/profiles');
    voiceboxProfileSelect.innerHTML = voiceboxProfiles.length
        ? voiceboxProfiles.map(profile => {
            const value = profile.id || profile.name;
            return `<option value="${escapeHTML(String(value))}">${escapeHTML(getVoiceboxProfileLabel(profile))}</option>`;
        }).join('')
        : '<option value="">등록된 프로필 없음</option>';

    voiceboxSpeakBtn.disabled = !voiceboxProfiles.length;
    compareBothBtn.disabled = !voiceboxProfiles.length || !textToSpeech;
}

async function loadPresetVoices() {
    if (!voiceboxConnected) return;

    const engine = presetEngineSelect.value;
    const payload = await voiceboxJson(`/profiles/presets/${encodeURIComponent(engine)}`);
    voiceboxPresetVoices = Array.isArray(payload.voices) ? payload.voices : [];

    presetVoiceSelect.innerHTML = voiceboxPresetVoices.length
        ? voiceboxPresetVoices.map(voice => {
            const label = `${voice.name || voice.voice_id} · ${voice.language || '-'} · ${voice.gender || '-'}`;
            return `<option value="${escapeHTML(voice.voice_id)}" data-language="${escapeHTML(voice.language || '')}">${escapeHTML(label)}</option>`;
        }).join('')
        : '<option value="">사용 가능한 프리셋 없음</option>';

    const selected = voiceboxPresetVoices[0];
    if (selected?.language) {
        presetProfileLanguageSelect.value = selected.language;
    }
    if (selected?.name) {
        presetProfileNameInput.value = selected.name;
    }
}

function renderHistory() {
    if (!runHistory.length) {
        historyTableBody.innerHTML = '<tr><td colspan="11" class="empty-history">아직 실행 기록이 없습니다</td></tr>';
        return;
    }

    historyTableBody.innerHTML = runHistory.map((run, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHTML(String(run.workflow))}</td>
            <td>${escapeHTML(String(run.voice))}</td>
            <td>${escapeHTML(String(run.lang))}</td>
            <td>${Number(run.chars) || 0}</td>
            <td>${escapeHTML(String(run.steps))}</td>
            <td>${escapeHTML(String(run.backend))}</td>
            <td>${run.audioDurationSec.toFixed(2)}s</td>
            <td>${run.generationTimeSec.toFixed(2)}s</td>
            <td>${run.rtf.toFixed(2)}</td>
            <td>${run.charsPerSec.toFixed(1)}</td>
        </tr>
    `).join('');
}

function showStatus(message, type = 'info') {
    const safeMessage = escapeHTML(String(message))
        .replaceAll('&lt;strong&gt;', '<strong>')
        .replaceAll('&lt;/strong&gt;', '</strong>');
    statusText.innerHTML = safeMessage;
    statusBox.className = 'status-box';
    if (type === 'success') {
        statusBox.classList.add('success');
    } else if (type === 'error') {
        statusBox.classList.add('error');
    }
}

function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.add('active');
}

function hideError() {
    errorBox.classList.remove('active');
}

function showBackendBadge() {
    backendBadge.classList.add('visible');
}

// Load voice style from JSON
async function loadStyleFromJSON(stylePath) {
    try {
        const style = await loadVoiceStyle([stylePath], true);
        return style;
    } catch (error) {
        console.error('Error loading voice style:', error);
        throw error;
    }
}

// Load models on page load
async function initializeModels() {
    try {
        showStatus('ℹ️ <strong>설정을 불러오는 중...</strong>');

        const basePath = 'assets/onnx';

        // Try WebGPU first, fallback to WASM
        let executionProvider = 'wasm';
        try {
            const result = await loadTextToSpeech(basePath, {
                executionProviders: ['webgpu'],
                graphOptimizationLevel: 'all'
            }, (modelName, current, total) => {
                showStatus(`ℹ️ <strong>ONNX 모델 로딩 (${current}/${total}):</strong> ${modelName}...`);
            });

            textToSpeech = result.textToSpeech;
            cfgs = result.cfgs;

            executionProvider = 'webgpu';
            activeBackend = 'WebGPU';
            backendBadge.textContent = 'WebGPU';
            backendBadge.style.background = '#4caf50';
        } catch (webgpuError) {
            console.log('WebGPU not available, falling back to WebAssembly');

            const result = await loadTextToSpeech(basePath, {
                executionProviders: ['wasm'],
                graphOptimizationLevel: 'all'
            }, (modelName, current, total) => {
                showStatus(`ℹ️ <strong>ONNX 모델 로딩 (${current}/${total}):</strong> ${modelName}...`);
            });

            textToSpeech = result.textToSpeech;
            cfgs = result.cfgs;
            activeBackend = 'WebAssembly';
        }

        showStatus('ℹ️ <strong>기본 음색 스타일을 불러오는 중...</strong>');

        // Load default voice style
        currentStyle = await loadStyleFromJSON(currentStylePath);
        voiceStyleInfo.textContent = `${getFilenameFromPath(currentStylePath)} (기본값)`;

        showStatus(`✅ <strong>모델 로딩 완료!</strong> ${executionProvider.toUpperCase()} 백엔드로 음성을 생성할 수 있습니다.`, 'success');
        showBackendBadge();
        updateMetrics();

        generateBtn.disabled = false;
        benchmarkBtn.disabled = false;
        compareBothBtn.disabled = !voiceboxConnected || !voiceboxProfileSelect.value;

    } catch (error) {
        console.error('Error loading models:', error);
        showStatus(`❌ <strong>모델 로딩 오류:</strong> ${error.message}`, 'error');
    }
}

// Handle voice style selection
voiceStyleSelect.addEventListener('change', async (e) => {
    const selectedValue = e.target.value;

    if (!selectedValue) return;

    try {
        generateBtn.disabled = true;
        showStatus(`ℹ️ <strong>음색 스타일을 불러오는 중...</strong>`, 'info');

        currentStylePath = selectedValue;
        currentStyle = await loadStyleFromJSON(currentStylePath);
        voiceStyleInfo.textContent = getFilenameFromPath(currentStylePath);

        showStatus(`✅ <strong>음색 스타일 로딩 완료:</strong> ${getFilenameFromPath(currentStylePath)}`, 'success');
        generateBtn.disabled = false;
    } catch (error) {
        showError(`음색 스타일 로딩 오류: ${error.message}`);

        // Restore default style
        currentStylePath = DEFAULT_VOICE_STYLE_PATH;
        voiceStyleSelect.value = currentStylePath;
        try {
            currentStyle = await loadStyleFromJSON(currentStylePath);
            voiceStyleInfo.textContent = `${getFilenameFromPath(currentStylePath)} (기본값)`;
        } catch (styleError) {
            console.error('Error restoring default style:', styleError);
        }

        generateBtn.disabled = false;
    }
});

// Main synthesis function
async function runSingleGeneration({ renderResult = true, runLabel = null } = {}) {
    const text = textInput.value.trim();
    if (!text) {
        showError('합성할 텍스트를 입력하세요.');
        return null;
    }

    if (!textToSpeech || !cfgs) {
        showError('모델을 아직 불러오는 중입니다. 잠시만 기다려 주세요.');
        return null;
    }

    if (!currentStyle) {
        showError('음색 스타일이 아직 준비되지 않았습니다. 잠시만 기다려 주세요.');
        return null;
    }

    const startTime = performance.now();

    try {
        generateBtn.disabled = true;
        benchmarkBtn.disabled = true;
        hideError();

        if (renderResult) {
            resultsContainer.innerHTML = `
                <div class="results-placeholder generating">
                    <div class="results-placeholder-icon">Working</div>
                    <p>Supertonic 음성을 생성하는 중...</p>
                </div>
            `;
        }

        const totalStep = parseInt(totalStepInput.value);
        const speed = parseFloat(speedInput.value);
        const lang = langSelect.value;
        const workflow = 'Supertonic TTS';
        const effectPreset = effectPresetSelect.value;

        showStatus(`ℹ️ <strong>${runLabel || 'Supertonic 음성 생성 중'}...</strong>`);
        const tic = performance.now();

        const { wav, duration } = await textToSpeech.call(
            text,
            lang,
            currentStyle,
            totalStep,
            speed,
            0.3,
            (step, total) => {
                showStatus(`ℹ️ <strong>디노이징 (${step}/${total})...</strong>`);
            }
        );

        const toc = performance.now();
        console.log(`Text-to-speech synthesis: ${((toc - tic) / 1000).toFixed(2)}s`);

        showStatus('ℹ️ <strong>오디오 파일을 만드는 중...</strong>');
        const wavLen = Math.floor(textToSpeech.sampleRate * duration[0]);
        const wavOut = wav.slice(0, wavLen);

        // Create WAV file
        const wavBuffer = writeWavFile(wavOut, textToSpeech.sampleRate);
        const blob = new Blob([wavBuffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);

        // Calculate total time and audio duration
        const endTime = performance.now();
        const totalTimeSec = (endTime - startTime) / 1000;
        const audioDurationSec = Number(duration[0]);
        const rtf = totalTimeSec / Math.max(audioDurationSec, 0.001);
        const charsPerSec = text.length / Math.max(totalTimeSec, 0.001);
        const summary = {
            workflow,
            voice: getFilenameFromPath(currentStylePath).replace('.json', ''),
            lang,
            chars: text.length,
            steps: totalStep,
            speed,
            effectPreset,
            backend: activeBackend,
            audioDurationSec,
            generationTimeSec: totalTimeSec,
            rtf,
            charsPerSec,
            audioUrl: url,
            text
        };

        runHistory.push(summary);
        updateMetrics(summary);
        renderHistory();

        // Display result with full text
        if (renderResult) {
            resultsContainer.innerHTML = `
                <div class="result-item">
                    <div class="result-text-container">
                        <div class="result-text-label">${workflow} 입력</div>
                        <div class="result-text">${escapeHTML(text)}</div>
                    </div>
                    <div class="result-info expanded">
                        <div class="info-item">
                            <span>오디오 길이</span>
                            <strong>${audioDurationSec.toFixed(2)}s</strong>
                        </div>
                        <div class="info-item">
                            <span>생성 시간</span>
                            <strong>${totalTimeSec.toFixed(2)}s</strong>
                        </div>
                        <div class="info-item">
                            <span>RTF</span>
                            <strong>${rtf.toFixed(2)}</strong>
                        </div>
                        <div class="info-item">
                            <span>글자/s</span>
                            <strong>${charsPerSec.toFixed(1)}</strong>
                        </div>
                    </div>
                    <div class="result-player">
                        <div class="applied-effect">브라우저 재생 프리셋: ${getEffectPresetLabel(effectPreset)}</div>
                        <audio id="latestAudio" controls>
                            <source src="${url}" type="audio/wav">
                        </audio>
                    </div>
                    <div class="result-actions">
                        <button onclick="downloadAudio('${url}', 'synthesized_speech.wav')">
                            <span>WAV 다운로드</span>
                        </button>
                    </div>
                </div>
            `;
            applyPlaybackPreset(effectPreset);
        }

        showStatus('✅ <strong>Supertonic 음성 생성이 완료되었습니다.</strong>', 'success');
        return summary;

    } catch (error) {
        console.error('Error during synthesis:', error);
        showStatus(`❌ <strong>합성 중 오류:</strong> ${error.message}`, 'error');
        showError(`합성 중 오류: ${error.message}`);

        // Restore placeholder
        resultsContainer.innerHTML = `
            <div class="results-placeholder">
                <div class="results-placeholder-icon">🎤</div>
                <p>생성된 음성이 여기에 표시됩니다</p>
            </div>
        `;
    }
}

async function connectVoicebox() {
    try {
        voiceboxConnectBtn.disabled = true;
        voiceboxSpeakBtn.disabled = true;
        compareBothBtn.disabled = true;
        setVoiceboxStatus('Voicebox 서버에 연결하는 중...');
        setVoiceboxToolsEnabled(false);
        hideError();

        const [health, profiles] = await Promise.all([
            voiceboxJson('/health'),
            voiceboxJson('/profiles')
        ]);

        voiceboxHealth = health;
        voiceboxProfiles = Array.isArray(profiles) ? profiles : [];
        voiceboxConnected = true;
        await refreshVoiceboxProfiles();
        await loadPresetVoices();

        const modelState = health.model_loaded ? '모델 로드됨' : (health.model_downloaded ? '모델 다운로드됨' : '모델 필요');
        setVoiceboxStatus(`${getVoiceboxBackendLabel()} 연결됨 · ${modelState} · 프로필 ${voiceboxProfiles.length}개`, 'success');
        renderToolOutput('Voicebox 연결됨', [
            `${escapeHTML(getVoiceboxBackendLabel())}`,
            `프로필 ${voiceboxProfiles.length}개 · 프리셋 ${voiceboxPresetVoices.length}개`,
            `STT, 음성복제 샘플 등록, 이펙트 조회를 사용할 수 있습니다.`
        ]);
        renderFeatureCoverage();
        setVoiceboxToolsEnabled(true);
        return true;
    } catch (error) {
        voiceboxConnected = false;
        voiceboxHealth = null;
        voiceboxProfiles = [];
        voiceboxPresetVoices = [];
        voiceboxProfileSelect.innerHTML = '<option value="">연결 후 불러오기</option>';
        presetVoiceSelect.innerHTML = '<option value="">연결 후 불러오기</option>';
        setVoiceboxToolsEnabled(false);
        updateTranscribeButtonState();
        setVoiceboxStatus(`연결 실패: ${error.message}`, 'error');
        renderFeatureCoverage();
        showError(`Voicebox 연결 오류: ${error.message}`);
        return false;
    } finally {
        voiceboxConnectBtn.disabled = false;
    }
}

function parseSseEventBlock(block) {
    const dataLines = block
        .split(/\r?\n/)
        .filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).trim());

    if (!dataLines.length) {
        return null;
    }

    return JSON.parse(dataLines.join('\n'));
}

async function waitForVoiceboxGeneration(generationId) {
    const baseUrl = normalizeBaseUrl(voiceboxBaseUrlInput.value);
    const response = await fetch(`${baseUrl}/generate/${encodeURIComponent(generationId)}/status`, {
        headers: { 'Accept': 'text/event-stream' }
    });

    if (!response.ok || !response.body) {
        throw new Error(`Voicebox 상태 확인 실패 (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const timeoutAt = Date.now() + 10 * 60 * 1000;

    while (Date.now() < timeoutAt) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() || '';

        for (const block of blocks) {
            const payload = parseSseEventBlock(block);
            if (!payload) continue;

            setVoiceboxStatus(`생성 상태: ${payload.status}`);

            if (payload.status === 'completed') {
                return payload;
            }

            if (payload.status === 'failed') {
                throw new Error(payload.error || 'Voicebox 생성 실패');
            }
        }
    }

    throw new Error('Voicebox 생성 상태 확인 시간이 초과되었습니다.');
}

function getAudioDuration(audioUrl) {
    return new Promise(resolve => {
        const audio = new Audio();
        audio.preload = 'metadata';
        audio.onloadedmetadata = () => resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
        audio.onerror = () => resolve(0);
        audio.src = audioUrl;
    });
}

function renderSingleResult(summary, label = summary.workflow) {
    resultsContainer.innerHTML = `
        <div class="result-item">
            <div class="result-text-container">
                <div class="result-text-label">${escapeHTML(label)} 입력</div>
                <div class="result-text">${escapeHTML(summary.text || textInput.value.trim())}</div>
            </div>
            <div class="result-info expanded">
                <div class="info-item">
                    <span>오디오 길이</span>
                    <strong>${summary.audioDurationSec.toFixed(2)}s</strong>
                </div>
                <div class="info-item">
                    <span>생성 시간</span>
                    <strong>${summary.generationTimeSec.toFixed(2)}s</strong>
                </div>
                <div class="info-item">
                    <span>RTF</span>
                    <strong>${summary.rtf.toFixed(2)}</strong>
                </div>
                <div class="info-item">
                    <span>글자/s</span>
                    <strong>${summary.charsPerSec.toFixed(1)}</strong>
                </div>
            </div>
            <div class="result-player">
                <div class="applied-effect">${escapeHTML(summary.backend)} · ${escapeHTML(summary.voice)}</div>
                <audio id="latestAudio" controls>
                    <source src="${summary.audioUrl}" type="audio/wav">
                </audio>
            </div>
            <div class="result-actions">
                <button onclick="downloadAudio('${summary.audioUrl}', '${summary.workflow.replaceAll(' ', '_')}.wav')">
                    <span>오디오 다운로드</span>
                </button>
            </div>
        </div>
    `;

    if (summary.effectPreset) {
        applyPlaybackPreset(summary.effectPreset);
    }
}

async function runVoiceboxSpeak({ renderResult = true, runLabel = null } = {}) {
    const text = textInput.value.trim();
    if (!text) {
        showError('합성할 텍스트를 입력하세요.');
        return null;
    }

    if (!voiceboxConnected) {
        showError('먼저 Voicebox 서버에 연결하세요.');
        return null;
    }

    if (!voiceboxProfileSelect.value) {
        showError('Voicebox 프로필을 선택하세요.');
        return null;
    }

    const selectedProfile = voiceboxProfiles.find(profile => String(profile.id || profile.name) === voiceboxProfileSelect.value);
    const requestBody = {
        text,
        profile: voiceboxProfileSelect.value,
        language: voiceboxLanguageSelect.value
    };

    if (voiceboxEngineSelect.value) {
        requestBody.engine = voiceboxEngineSelect.value;
    }

    if (voiceboxPersonalityInput.checked) {
        requestBody.personality = true;
    }

    const startTime = performance.now();

    try {
        voiceboxSpeakBtn.disabled = true;
        compareBothBtn.disabled = true;
        hideError();

        if (renderResult) {
            resultsContainer.innerHTML = `
                <div class="results-placeholder generating">
                    <div class="results-placeholder-icon">Working</div>
                    <p>Voicebox 음성을 생성하는 중...</p>
                </div>
            `;
        }

        showStatus(`ℹ️ <strong>${runLabel || 'Voicebox 음성 생성 요청 중'}...</strong>`);
        setVoiceboxStatus('Voicebox /speak 요청 중...');

        const generation = await voiceboxJson('/speak', {
            method: 'POST',
            body: JSON.stringify(requestBody)
        });

        const generationId = generation.id;
        if (!generationId) {
            throw new Error('Voicebox 응답에 생성 ID가 없습니다.');
        }

        const statusPayload = await waitForVoiceboxGeneration(generationId);
        const audioUrl = `${normalizeBaseUrl(voiceboxBaseUrlInput.value)}/audio/${encodeURIComponent(generationId)}?t=${Date.now()}`;
        const endTime = performance.now();
        const totalTimeSec = (endTime - startTime) / 1000;
        const audioDurationSec = Number(statusPayload.duration || generation.duration) || await getAudioDuration(audioUrl);
        const rtf = totalTimeSec / Math.max(audioDurationSec, 0.001);
        const charsPerSec = text.length / Math.max(totalTimeSec, 0.001);
        const engine = voiceboxEngineSelect.value || selectedProfile?.default_engine || selectedProfile?.preset_engine || generation.engine || '프로필 기본값';
        const summary = {
            workflow: 'Voicebox TTS',
            voice: getVoiceboxProfileLabel(selectedProfile),
            lang: voiceboxLanguageSelect.value,
            chars: text.length,
            steps: engine,
            speed: null,
            effectPreset: null,
            backend: getVoiceboxBackendLabel(),
            audioDurationSec,
            generationTimeSec: totalTimeSec,
            rtf,
            charsPerSec,
            audioUrl,
            text
        };

        runHistory.push(summary);
        updateMetrics(summary);
        renderHistory();

        if (renderResult) {
            renderSingleResult(summary);
        }

        showStatus('✅ <strong>Voicebox 음성 생성이 완료되었습니다.</strong>', 'success');
        setVoiceboxStatus(`생성 완료 · ${generationId}`, 'success');
        return summary;
    } catch (error) {
        console.error('Voicebox synthesis error:', error);
        showStatus(`❌ <strong>Voicebox 오류:</strong> ${error.message}`, 'error');
        setVoiceboxStatus(`생성 실패: ${error.message}`, 'error');
        showError(`Voicebox 생성 오류: ${error.message}`);
        return null;
    } finally {
        voiceboxSpeakBtn.disabled = !voiceboxConnected || !voiceboxProfileSelect.value;
        compareBothBtn.disabled = !voiceboxConnected || !voiceboxProfileSelect.value || !textToSpeech;
    }
}

function renderComparisonResult(supertonicSummary, voiceboxSummary) {
    const cards = [supertonicSummary, voiceboxSummary].filter(Boolean).map(summary => `
        <div class="comparison-card">
            <div class="comparison-title">${escapeHTML(summary.workflow)}</div>
            <div class="comparison-meta">${escapeHTML(summary.voice)} · ${escapeHTML(summary.backend)}</div>
            <div class="comparison-stats">
                <span>RTF <strong>${summary.rtf.toFixed(2)}</strong></span>
                <span>시간 <strong>${summary.generationTimeSec.toFixed(2)}s</strong></span>
                <span>오디오 <strong>${summary.audioDurationSec.toFixed(2)}s</strong></span>
            </div>
            <audio controls>
                <source src="${summary.audioUrl}" type="audio/wav">
            </audio>
        </div>
    `).join('');

    resultsContainer.innerHTML = `
        <div class="result-item">
            <div class="result-text-container compact-result-text">
                <div class="result-text-label">동시 비교 입력</div>
                <div class="result-text">${escapeHTML(textInput.value.trim())}</div>
            </div>
            <div class="comparison-grid">${cards}</div>
        </div>
    `;
}

async function runBothComparison() {
    try {
        generateBtn.disabled = true;
        benchmarkBtn.disabled = true;
        voiceboxSpeakBtn.disabled = true;
        compareBothBtn.disabled = true;
        resultsContainer.innerHTML = `
            <div class="results-placeholder generating">
                <div class="results-placeholder-icon">Working</div>
                <p>Supertonic과 Voicebox를 순서대로 실행하는 중...</p>
            </div>
        `;

        const supertonicSummary = await runSingleGeneration({
            renderResult: false,
            runLabel: 'Supertonic 비교 실행'
        });
        const voiceboxSummary = await runVoiceboxSpeak({
            renderResult: false,
            runLabel: 'Voicebox 비교 실행'
        });

        if (supertonicSummary || voiceboxSummary) {
            renderComparisonResult(supertonicSummary, voiceboxSummary);
        }

        if (supertonicSummary && voiceboxSummary) {
            showStatus('✅ <strong>Supertonic / Voicebox 비교 실행이 완료되었습니다.</strong>', 'success');
        }
    } finally {
        generateBtn.disabled = !textToSpeech;
        benchmarkBtn.disabled = !textToSpeech;
        voiceboxSpeakBtn.disabled = !voiceboxConnected || !voiceboxProfileSelect.value;
        compareBothBtn.disabled = !voiceboxConnected || !voiceboxProfileSelect.value || !textToSpeech;
    }
}

async function createPresetProfile() {
    if (!voiceboxConnected) {
        showError('먼저 Voicebox 서버에 연결하세요.');
        return;
    }

    const selectedVoice = voiceboxPresetVoices.find(voice => voice.voice_id === presetVoiceSelect.value);
    if (!selectedVoice) {
        showError('프리셋 음성을 선택하세요.');
        return;
    }

    const engine = presetEngineSelect.value;
    const profileName = presetProfileNameInput.value.trim() || selectedVoice.name || selectedVoice.voice_id;
    const language = presetProfileLanguageSelect.value || selectedVoice.language || 'en';

    try {
        createPresetProfileBtn.disabled = true;
        hideError();
        setVoiceboxStatus('프리셋 프로필을 생성하는 중...');

        const profile = await voiceboxJson('/profiles', {
            method: 'POST',
            body: JSON.stringify({
                name: profileName,
                description: `Voicebox ${engine} preset profile`,
                language,
                voice_type: 'preset',
                preset_engine: engine,
                preset_voice_id: selectedVoice.voice_id,
                default_engine: engine
            })
        });

        await refreshVoiceboxProfiles();
        voiceboxProfileSelect.value = profile.id;
        renderJsonOutput('프리셋 프로필 생성 완료', profile);
        setVoiceboxStatus(`프로필 생성 완료 · ${profile.name}`, 'success');
    } catch (error) {
        showError(`프리셋 프로필 생성 오류: ${error.message}`);
        setVoiceboxStatus(`프로필 생성 실패: ${error.message}`, 'error');
    } finally {
        createPresetProfileBtn.disabled = !voiceboxConnected;
    }
}

async function createCloneProfile() {
    if (!voiceboxConnected) {
        showError('먼저 Voicebox 서버에 연결하세요.');
        return;
    }

    const name = cloneProfileNameInput.value.trim();
    if (!name) {
        showError('복제 프로필 이름을 입력하세요.');
        return;
    }

    try {
        createCloneProfileBtn.disabled = true;
        hideError();
        setVoiceboxStatus('복제 프로필을 생성하는 중...');

        const profile = await voiceboxJson('/profiles', {
            method: 'POST',
            body: JSON.stringify({
                name,
                description: 'Voicebox cloned voice profile',
                language: cloneProfileLanguageSelect.value,
                voice_type: 'cloned',
                default_engine: 'qwen'
            })
        });

        let sample = null;
        const file = cloneSampleFileInput.files?.[0];
        if (file) {
            const referenceText = cloneReferenceTextInput.value.trim();
            if (!referenceText) {
                throw new Error('참조 음성 파일을 등록하려면 참조 음성 원문이 필요합니다.');
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('reference_text', referenceText);
            sample = await voiceboxForm(`/profiles/${encodeURIComponent(profile.id)}/samples`, formData);
        }

        await refreshVoiceboxProfiles();
        voiceboxProfileSelect.value = profile.id;
        renderJsonOutput(sample ? '복제 프로필 및 샘플 등록 완료' : '복제 프로필 생성 완료', { profile, sample });
        setVoiceboxStatus(sample ? `복제 프로필/샘플 등록 완료 · ${profile.name}` : `복제 프로필 생성 완료 · ${profile.name}`, 'success');
    } catch (error) {
        showError(`복제 프로필 생성 오류: ${error.message}`);
        setVoiceboxStatus(`복제 프로필 실패: ${error.message}`, 'error');
    } finally {
        createCloneProfileBtn.disabled = !voiceboxConnected;
    }
}

function buildSttFormData(audioSource, filename, selectedModel) {
    const formData = new FormData();
    formData.append('file', audioSource, filename);
    if (sttLanguageSelect.value) formData.append('language', sttLanguageSelect.value);
    if (selectedModel) formData.append('model', selectedModel);
    return formData;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForVoiceboxModel(modelName, timeoutMs = 10 * 60 * 1000) {
    const startedAt = Date.now();
    const label = modelName.replace(/^whisper-/, 'Whisper ');

    while (Date.now() - startedAt < timeoutMs) {
        const status = await voiceboxJson('/models/status');
        const model = status.models?.find(item => item.model_name === modelName);
        if (model?.downloaded || model?.loaded) {
            setVoiceboxStatus(`${label} 모델 준비 완료. STT 전사를 다시 실행합니다.`, 'success');
            return;
        }

        const elapsedSec = Math.round((Date.now() - startedAt) / 1000);
        const state = model?.downloading ? '다운로드 중' : '준비 중';
        setVoiceboxStatus(`${label} 모델 ${state} · ${elapsedSec}s 경과 · 완료되면 자동으로 전사합니다.`, 'success');
        await sleep(3000);
    }

    throw new Error(`${label} 모델 다운로드 대기 시간이 초과되었습니다. 모델 상태를 새로고침해 확인하세요.`);
}

function audioBufferToWavBlob(audioBuffer) {
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const frames = audioBuffer.length;
    const bytesPerSample = 2;
    const blockAlign = channels * bytesPerSample;
    const dataSize = frames * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    let offset = 0;

    const writeString = value => {
        for (let i = 0; i < value.length; i++) {
            view.setUint8(offset++, value.charCodeAt(i));
        }
    };

    writeString('RIFF');
    view.setUint32(offset, 36 + dataSize, true); offset += 4;
    writeString('WAVE');
    writeString('fmt ');
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, 1, true); offset += 2;
    view.setUint16(offset, channels, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, sampleRate * blockAlign, true); offset += 4;
    view.setUint16(offset, blockAlign, true); offset += 2;
    view.setUint16(offset, 16, true); offset += 2;
    writeString('data');
    view.setUint32(offset, dataSize, true); offset += 4;

    const channelData = Array.from({ length: channels }, (_, channel) => audioBuffer.getChannelData(channel));
    for (let frame = 0; frame < frames; frame++) {
        for (let channel = 0; channel < channels; channel++) {
            const sample = Math.max(-1, Math.min(1, channelData[channel][frame]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
            offset += 2;
        }
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

async function convertBlobToWav(blob) {
    if (blob.type.includes('wav')) return blob;

    const arrayBuffer = await blob.arrayBuffer();
    const context = new AudioContext();
    try {
        const audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0));
        return audioBufferToWavBlob(audioBuffer);
    } finally {
        await context.close();
    }
}

async function transcribeAudio() {
    if (!voiceboxConnected) {
        setVoiceboxStatus('Voicebox 서버에 자동 연결하는 중...');
        const connected = await connectVoicebox();
        if (!connected) {
            const baseUrl = normalizeBaseUrl(voiceboxBaseUrlInput.value) || '/voicebox-api';
            showError(`Voicebox 서버 연결에 실패했습니다. ${baseUrl} 대상 백엔드가 실행 중인지 확인하세요.`);
            updateTranscribeButtonState();
            return;
        }
    }

    const file = sttAudioFileInput.files?.[0];
    const audioSource = recordedSttBlob || file;
    const sourceName = recordedSttBlob ? 'microphone-recording.wav' : file?.name;
    if (!audioSource) {
        showError('전사할 오디오 파일을 선택하거나 마이크로 녹음하세요.');
        return;
    }

    const selectedModel = sttModelSelect.value === 'large-v3-turbo' ? 'turbo' : sttModelSelect.value;

    const startTime = performance.now();
    try {
        transcribeBtn.disabled = true;
        hideError();
        setVoiceboxStatus('STT 전사를 실행하는 중...');

        let result = await voiceboxForm('/transcribe', buildSttFormData(audioSource, sourceName, selectedModel));
        if (result.detail?.downloading) {
            renderJsonOutput('Whisper 모델 다운로드 시작', result.detail);
            setVoiceboxStatus(`${result.detail.message || 'Whisper 모델 다운로드 중입니다.'} 완료되면 자동으로 다시 시도합니다.`, 'success');
            await waitForVoiceboxModel(result.detail.model_name);
            result = await voiceboxForm('/transcribe', buildSttFormData(audioSource, sourceName, selectedModel));
        }
        const elapsedSec = (performance.now() - startTime) / 1000;

        renderToolOutput('STT 전사 결과', [
            `<strong>입력</strong>: ${escapeHTML(recordedSttBlob ? '마이크 녹음' : file.name)}`,
            `<strong>오디오 길이</strong>: ${(Number(result.duration) || 0).toFixed(2)}s`,
            `<strong>처리 시간</strong>: ${elapsedSec.toFixed(2)}s`,
            `<strong>텍스트</strong>: ${escapeHTML(result.text || '')}`
        ]);

        resultsContainer.innerHTML = `
            <div class="result-item">
                <div class="result-text-container">
                    <div class="result-text-label">Voicebox STT 결과</div>
                    <div class="result-text">${escapeHTML(result.text || '')}</div>
                </div>
                <div class="result-info">
                    <div class="info-item">
                        <span>오디오 길이</span>
                        <strong>${(Number(result.duration) || 0).toFixed(2)}s</strong>
                    </div>
                    <div class="info-item">
                        <span>처리 시간</span>
                        <strong>${elapsedSec.toFixed(2)}s</strong>
                    </div>
                </div>
            </div>
        `;
        setVoiceboxStatus('STT 전사가 완료되었습니다.', 'success');
    } catch (error) {
        const message = error.message.includes('202')
            ? 'Whisper 모델 다운로드가 시작되었습니다. 잠시 후 다시 실행하세요.'
            : error.message;
        showError(`STT 오류: ${message}`);
        setVoiceboxStatus(`STT 실패: ${message}`, 'error');
    } finally {
        updateTranscribeButtonState();
    }
}

async function startMicRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        showError('이 브라우저는 마이크 녹음을 지원하지 않습니다.');
        return;
    }

    try {
        hideError();
        recordedSttBlob = null;
        micRecordChunks = [];
        micRecordPreview.classList.add('hidden');
        micRecordPreview.removeAttribute('src');
        updateTranscribeButtonState();
        updateMicMonitor({ state: '권한 확인 중', seconds: 0, level: 0, recording: true });

        const selectedDeviceId = micDeviceSelect.value;
        const audioConstraints = {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        };
        if (selectedDeviceId) {
            audioConstraints.deviceId = { exact: selectedDeviceId };
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints
        });
        await refreshMicDevices();
        const mimeType = getSupportedRecordingMimeType();
        micRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        micRecordStartedAt = performance.now();
        startMicLevelMeter(stream);

        micRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                micRecordChunks.push(event.data);
            }
        };

        micRecorder.onstop = async () => {
            stopMicLevelMeter();
            stream.getTracks().forEach(track => track.stop());
            const recordType = micRecorder.mimeType || mimeType || 'audio/webm';
            const rawRecordedBlob = new Blob(micRecordChunks, { type: recordType });
            if (!rawRecordedBlob.size) {
                micRecordStatus.textContent = '녹음 데이터가 비어 있습니다. 마이크 입력 장치와 권한을 확인하세요.';
                updateMicMonitor({ state: '녹음 실패', seconds: 0, level: 0 });
                startMicRecordBtn.disabled = false;
                stopMicRecordBtn.disabled = true;
                updateTranscribeButtonState();
                return;
            }

            try {
                recordedSttBlob = await convertBlobToWav(rawRecordedBlob);
            } catch (error) {
                recordedSttBlob = rawRecordedBlob;
                showError(`녹음 WAV 변환 실패: ${error.message}. 원본 녹음 포맷으로 전사를 시도합니다.`);
            }

            const previewUrl = URL.createObjectURL(recordedSttBlob);
            micRecordPreview.srcObject = null;
            micRecordPreview.src = previewUrl;
            micRecordPreview.muted = false;
            micRecordPreview.volume = 1;
            micRecordPreview.classList.remove('hidden');
            micRecordPreview.load();
            const durationSec = ((performance.now() - micRecordStartedAt) / 1000).toFixed(1);
            const tinyWarning = recordedSttBlob.size < 2048 ? ' · 데이터가 너무 작습니다. 마이크 입력을 확인하세요.' : '';
            micRecordStatus.textContent = `녹음 완료 · ${durationSec}s · ${(recordedSttBlob.size / 1024).toFixed(1)}KB · ${recordedSttBlob.type || recordType}${tinyWarning}`;
            updateMicMonitor({ state: '녹음 완료', seconds: Number(durationSec), level: 0 });
            startMicRecordBtn.disabled = false;
            stopMicRecordBtn.disabled = true;
            updateTranscribeButtonState();
        };

        micRecorder.onerror = event => {
            stopMicLevelMeter();
            updateMicMonitor({ state: '녹음 오류', seconds: 0, level: 0 });
            updateTranscribeButtonState();
            showError(`마이크 녹음 오류: ${event.error?.message || '알 수 없는 오류'}`);
        };

        micRecorder.start(250);
        updateMicMonitor({ state: '녹음 중', seconds: 0, level: 0, recording: true });
        micRecordStatus.textContent = '녹음 중 · 3~10초 권장 · 입력 레벨을 확인하세요.';
        startMicRecordBtn.disabled = true;
        stopMicRecordBtn.disabled = false;
        updateTranscribeButtonState();
    } catch (error) {
        stopMicLevelMeter();
        updateMicMonitor({ state: '녹음 실패', seconds: 0, level: 0 });
        showError(`마이크 녹음 오류: ${error.message}`);
        micRecordStatus.textContent = `녹음 실패: ${error.message}`;
        startMicRecordBtn.disabled = false;
        stopMicRecordBtn.disabled = true;
        updateTranscribeButtonState();
    }
}

function stopMicRecording() {
    if (micRecorder && micRecorder.state === 'recording') {
        micRecorder.stop();
        updateMicMonitor({ state: '저장 중', seconds: (performance.now() - micRecordStartedAt) / 1000, level: 0 });
        micRecordStatus.textContent = '녹음을 저장하는 중...';
        updateTranscribeButtonState();
    }
}

async function refreshVoiceboxStatus() {
    if (!voiceboxConnected) return;

    try {
        const [health, modelStatus, activeTasks] = await Promise.all([
            voiceboxJson('/health'),
            voiceboxJson('/models/status').catch(error => ({ error: error.message })),
            voiceboxJson('/tasks/active').catch(error => ({ error: error.message }))
        ]);
        voiceboxHealth = health;
        renderJsonOutput('Voicebox 모델/작업 상태', { health, modelStatus, activeTasks });
        setVoiceboxStatus(`${getVoiceboxBackendLabel()} 상태 새로고침 완료`, 'success');
    } catch (error) {
        showError(`Voicebox 상태 조회 오류: ${error.message}`);
    }
}

async function loadEffects() {
    if (!voiceboxConnected) return;

    try {
        const [available, presets] = await Promise.all([
            voiceboxJson('/effects/available'),
            voiceboxJson('/effects/presets')
        ]);
        const effectNames = (available.effects || []).map(effect => effect.type || effect.name).filter(Boolean);
        const presetNames = (presets || []).map(preset => preset.name).filter(Boolean);
        renderToolOutput('Voicebox 이펙트', [
            `<strong>사용 가능한 이펙트</strong>: ${escapeHTML(effectNames.join(', ') || '없음')}`,
            `<strong>프리셋</strong>: ${escapeHTML(presetNames.join(', ') || '없음')}`
        ]);
        setVoiceboxStatus(`이펙트 ${effectNames.length}개, 프리셋 ${presetNames.length}개 로드 완료`, 'success');
    } catch (error) {
        showError(`이펙트 조회 오류: ${error.message}`);
        setVoiceboxStatus(`이펙트 조회 실패: ${error.message}`, 'error');
    }
}

async function generateSpeech() {
    try {
        await runSingleGeneration();
    } finally {
        generateBtn.disabled = false;
        benchmarkBtn.disabled = false;
    }
}

async function runBenchmark() {
    const repeats = Math.max(1, Math.min(5, parseInt(benchmarkRepeatsInput.value) || 1));
    try {
        for (let i = 0; i < repeats; i++) {
            await runSingleGeneration({
                renderResult: i === repeats - 1,
                runLabel: `벤치마크 ${i + 1}/${repeats}`
            });
        }
        showStatus(`✅ <strong>벤치마크 완료:</strong> ${repeats}회 실행 기록을 저장했습니다.`, 'success');
    } finally {
        generateBtn.disabled = false;
        benchmarkBtn.disabled = false;
    }
}

function applyPlaybackPreset(preset) {
    const audio = document.getElementById('latestAudio');
    if (!audio) return;

    const settings = {
        clean: { rate: 1, volume: 1 },
        radio: { rate: 1.03, volume: 0.85 },
        deep: { rate: 0.92, volume: 1 },
        bright: { rate: 1.08, volume: 1 }
    }[preset] || { rate: 1, volume: 1 };

    audio.playbackRate = settings.rate;
    audio.volume = settings.volume;
}

// Download handler (make it global so it can be called from onclick)
window.downloadAudio = function(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
};

// Attach generate function to button
generateBtn.addEventListener('click', generateSpeech);
benchmarkBtn.addEventListener('click', runBenchmark);
voiceboxConnectBtn.addEventListener('click', connectVoicebox);
voiceboxSpeakBtn.addEventListener('click', () => runVoiceboxSpeak());
compareBothBtn.addEventListener('click', runBothComparison);
presetEngineSelect.addEventListener('change', loadPresetVoices);
presetVoiceSelect.addEventListener('change', () => {
    const selected = voiceboxPresetVoices.find(voice => voice.voice_id === presetVoiceSelect.value);
    if (selected?.language) presetProfileLanguageSelect.value = selected.language;
    if (selected?.name) presetProfileNameInput.value = selected.name;
});
createPresetProfileBtn.addEventListener('click', createPresetProfile);
createCloneProfileBtn.addEventListener('click', createCloneProfile);
startMicRecordBtn.addEventListener('click', startMicRecording);
stopMicRecordBtn.addEventListener('click', stopMicRecording);
if (navigator.mediaDevices?.addEventListener) {
    navigator.mediaDevices.addEventListener('devicechange', refreshMicDevices);
}
sttAudioFileInput.addEventListener('change', () => {
    if (sttAudioFileInput.files?.[0]) {
        recordedSttBlob = null;
        micRecordPreview.classList.add('hidden');
        micRecordPreview.removeAttribute('src');
        updateMicMonitor({ state: '파일 선택됨', seconds: 0, level: 0 });
        micRecordStatus.textContent = `파일 선택됨 · ${sttAudioFileInput.files[0].name}`;
    }
    updateTranscribeButtonState();
});
transcribeBtn.addEventListener('click', transcribeAudio);
refreshVoiceboxStatusBtn.addEventListener('click', refreshVoiceboxStatus);
loadEffectsBtn.addEventListener('click', loadEffects);
effectPresetSelect.addEventListener('change', () => applyPlaybackPreset(effectPresetSelect.value));

// Initialize on load
window.addEventListener('load', async () => {
    generateBtn.disabled = true;
    benchmarkBtn.disabled = true;
    voiceboxSpeakBtn.disabled = true;
    compareBothBtn.disabled = true;
    setVoiceboxToolsEnabled(false);
    initializeMicControls();
    updateTranscribeButtonState();
    renderFeatureCoverage();
    renderHistory();
    await initializeModels();
});
