// Android Material You Translucent Calculator — Full Logic

// ─────────────────────────────────────────────
// App State
// ─────────────────────────────────────────────
const state = {
    formula: '',
    display: '0',
    degMode: true,       // true = Degrees, false = Radians
    isEvaluated: false,
    sciMode: false       // false = Standard, true = Scientific
};

// Settings State (localStorage)
const settings = {
    soundEnabled: true,
    glowEnabled: true,
    blurIntensity: 20,
    wallpaper: 'neon_fluid',
    timeFormat: 'in'    // 'in' = Indian 24h, 'us' = US 12h AM/PM
};

// ─────────────────────────────────────────────
// DOM References
// ─────────────────────────────────────────────
const elAppTitle         = document.getElementById('appTitle');
const elDisplayFormula   = document.getElementById('displayFormula');
const elDisplayMain      = document.getElementById('displayMain');

const elSciToggleBtn     = document.getElementById('sciToggleBtn');
const elSettingsToggleBtn= document.getElementById('settingsToggleBtn');
const elSettingsPanel    = document.getElementById('settingsPanel');
const elCloseSettingsBtn = document.getElementById('closeSettingsBtn');
const elSoundSwitch      = document.getElementById('soundSwitch');
const elGlowSwitch       = document.getElementById('glowSwitch');
const elBlurRange        = document.getElementById('blurRange');
const elBlurVal          = document.getElementById('blurVal');
const elTimeFormatSelect = document.getElementById('timeFormatSelect');
const elWallpaperThumbs  = document.querySelectorAll('.wallpaper-thumb');
const elWallpaperContainer = document.getElementById('wallpaperContainer');

const elHistoryToggleBtn = document.getElementById('historyToggleBtn');
const elHistoryPanel     = document.getElementById('historyPanel');
const elCloseHistoryBtn  = document.getElementById('closeHistoryBtn');
const elClearHistoryBtn  = document.getElementById('clearHistoryBtn');
const elHistoryList      = document.getElementById('historyList');

const elStandardScreen   = document.getElementById('standardScreen');
const elScientificScreen = document.getElementById('scientificScreen');

// ─────────────────────────────────────────────
// 1. Audio Click Synthesizer (Web Audio API)
// ─────────────────────────────────────────────
let audioCtx = null;
function playClickSound() {
    if (!settings.soundEnabled) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.04);
    } catch(e) {}
}

// ─────────────────────────────────────────────
// 2. Live Clock (Indian 24h / US 12h AM-PM)
// ─────────────────────────────────────────────
function updateClock() {
    const now = new Date();
    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    let timeStr;

    if (settings.timeFormat === 'us') {
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        timeStr = `${h}:${m} ${ampm}`;
    } else {
        timeStr = `${String(h).padStart(2, '0')}:${m}`;
    }

    if (elAppTitle) elAppTitle.innerText = `Calculator  •  ${timeStr}`;
}
setInterval(updateClock, 1000);
updateClock();

// ─────────────────────────────────────────────
// 3. Scientific Mode Toggle
// ─────────────────────────────────────────────
function toggleSciMode() {
    state.sciMode = !state.sciMode;

    if (state.sciMode) {
        elStandardScreen.classList.remove('active');
        elScientificScreen.classList.add('active');
        elSciToggleBtn.classList.add('active-mode');
        elSciToggleBtn.innerText = 'Std';
    } else {
        elScientificScreen.classList.remove('active');
        elStandardScreen.classList.add('active');
        elSciToggleBtn.classList.remove('active-mode');
        elSciToggleBtn.innerText = 'Sci';
    }
    // Re-bind buttons because DOM has changed to active screen
    bindButtons();
}

elSciToggleBtn.addEventListener('click', () => {
    toggleSciMode();
    playClickSound();
});

// ─────────────────────────────────────────────
// 4. Settings Load / Save / Apply
// ─────────────────────────────────────────────
function loadSettings() {
    const saved = localStorage.getItem('calc_settings_v2');
    if (saved) {
        try { Object.assign(settings, JSON.parse(saved)); } catch(e) {}
    }
    elSoundSwitch.checked      = settings.soundEnabled;
    elGlowSwitch.checked       = settings.glowEnabled;
    elBlurRange.value          = settings.blurIntensity;
    elBlurVal.innerText        = `${settings.blurIntensity}px`;
    elTimeFormatSelect.value   = settings.timeFormat;
    applySettings();
    updateClock();
}

function saveSettings() {
    localStorage.setItem('calc_settings_v2', JSON.stringify(settings));
}

function applySettings() {
    document.documentElement.style.setProperty('--blur-intensity', `${settings.blurIntensity}px`);
    document.body.classList.toggle('enable-glows', settings.glowEnabled);
    elWallpaperContainer.className = `wallpaper-container wp-${settings.wallpaper}`;
    elWallpaperThumbs.forEach(t => t.classList.toggle('active', t.dataset.wallpaper === settings.wallpaper));
}

// Settings listeners
elSoundSwitch.addEventListener('change', e => { settings.soundEnabled = e.target.checked; saveSettings(); });
elGlowSwitch.addEventListener('change',  e => { settings.glowEnabled  = e.target.checked; saveSettings(); applySettings(); });
elBlurRange.addEventListener('input',    e => {
    settings.blurIntensity = e.target.value;
    elBlurVal.innerText = `${settings.blurIntensity}px`;
    saveSettings(); applySettings();
});
elTimeFormatSelect.addEventListener('change', e => {
    settings.timeFormat = e.target.value;
    saveSettings(); updateClock();
});
elWallpaperThumbs.forEach(t => t.addEventListener('click', () => {
    settings.wallpaper = t.dataset.wallpaper;
    saveSettings(); applySettings(); playClickSound();
}));

elSettingsToggleBtn.addEventListener('click', () => { elSettingsPanel.classList.add('open'); playClickSound(); });
elCloseSettingsBtn.addEventListener('click',  () => { elSettingsPanel.classList.remove('open'); playClickSound(); });

// ─────────────────────────────────────────────
// 5. History
// ─────────────────────────────────────────────
let historyData = [];

function loadHistory() {
    try { historyData = JSON.parse(localStorage.getItem('calc_history') || '[]'); } catch(e) { historyData = []; }
    renderHistory();
}
function saveHistory() { localStorage.setItem('calc_history', JSON.stringify(historyData)); }

function addToHistory(formula, result) {
    historyData.unshift({ formula, result });
    if (historyData.length > 50) historyData.pop();
    saveHistory(); renderHistory();
}

function renderHistory() {
    if (!historyData.length) {
        elHistoryList.innerHTML = '<div class="empty-history-msg">No history yet</div>';
        return;
    }
    elHistoryList.innerHTML = historyData.map(item => `
        <div class="history-item" data-formula="${escapeHtml(item.formula)}" data-result="${escapeHtml(item.result)}">
            <div class="history-item-formula">${escapeHtml(item.formula)}</div>
            <div class="history-item-result">${escapeHtml(item.result)}</div>
        </div>`).join('');
    document.querySelectorAll('.history-item').forEach(el => {
        el.addEventListener('click', () => {
            state.display = el.dataset.result;
            state.formula = el.dataset.formula;
            state.isEvaluated = true;
            updateDisplay();
            elHistoryPanel.classList.remove('open');
            playClickSound();
        });
    });
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

elHistoryToggleBtn.addEventListener('click', () => { elHistoryPanel.classList.add('open'); playClickSound(); });
elCloseHistoryBtn.addEventListener('click',  () => { elHistoryPanel.classList.remove('open'); playClickSound(); });
elClearHistoryBtn.addEventListener('click',  () => { historyData=[]; saveHistory(); renderHistory(); playClickSound(); });

// ─────────────────────────────────────────────
// 6. Math Engine
// ─────────────────────────────────────────────
function degToRad(d) { return d * Math.PI / 180; }

function factorial(n) {
    n = Math.floor(Math.abs(n));
    if (n > 170) return Infinity;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
}

function calculateFormula(expr) {
    try {
        let e = expr
            .replace(/÷/g, '/')
            .replace(/×/g, '*')
            .replace(/−/g, '-')
            .replace(/π/g, '(Math.PI)')
            .replace(/\be\b/g, '(Math.E)')
            .replace(/\^/g, '**');

        // Percent
        e = e.replace(/(\d+\.?\d*)%/g, '($1/100)');

        // Auto-close parentheses
        const opens  = (e.match(/\(/g) || []).length;
        const closes = (e.match(/\)/g) || []).length;
        if (opens > closes) e += ')'.repeat(opens - closes);

        // Build math context
        const ctx = {
            sin:  x => state.degMode ? Math.sin(degToRad(x)) : Math.sin(x),
            cos:  x => state.degMode ? Math.cos(degToRad(x)) : Math.cos(x),
            tan:  x => state.degMode ? Math.tan(degToRad(x)) : Math.tan(x),
            asin: x => state.degMode ? Math.asin(x) * 180 / Math.PI : Math.asin(x),
            acos: x => state.degMode ? Math.acos(x) * 180 / Math.PI : Math.acos(x),
            atan: x => state.degMode ? Math.atan(x) * 180 / Math.PI : Math.atan(x),
            log:  x => Math.log10(x),
            ln:   x => Math.log(x),
            sqrt: x => Math.sqrt(x),
            exp:  x => Math.exp(x),
            fact: x => factorial(x),
            rand: () => Math.random(),
            abs:  x => Math.abs(x),
            pow:  (x, y) => Math.pow(x, y),
            PI: Math.PI,
            E:  Math.E
        };

        // Validate — allow digits, ops, parens, dots, spaces, and named functions
        const cleanCheck = e.replace(/\b(sin|cos|tan|asin|acos|atan|log|ln|sqrt|exp|fact|rand|abs|pow|Math\.PI|Math\.E)\b/gi, '1');
        if (!/^[0-9+\-*/.() **,\s]*$/.test(cleanCheck)) throw new Error('Invalid');

        const keys = Object.keys(ctx);
        const vals = Object.values(ctx);
        const fn = new Function(...keys, `"use strict"; return (${e});`);
        let result = fn(...vals);

        if (typeof result === 'number' && !isNaN(result)) {
            if (result.toString().includes('.') && result.toString().split('.')[1].length > 10) {
                result = parseFloat(result.toFixed(10));
            }
        }
        return result;
    } catch(err) {
        return 'Error';
    }
}

// ─────────────────────────────────────────────
// 7. Display
// ─────────────────────────────────────────────
function adjustDisplayFontSize() {
    const len = state.display.length;
    if      (len > 18) elDisplayMain.style.fontSize = '1.6rem';
    else if (len > 13) elDisplayMain.style.fontSize = '2.2rem';
    else if (len > 9)  elDisplayMain.style.fontSize = '3rem';
    else               elDisplayMain.style.fontSize = '3.8rem';
}

function updateDisplay() {
    elDisplayFormula.innerText = state.formula;
    elDisplayMain.innerText    = state.display;
    adjustDisplayFontSize();
}

// ─────────────────────────────────────────────
// 8. Operator Highlighting
// ─────────────────────────────────────────────
function setActiveOperator(op) {
    document.querySelectorAll('.btn-operator').forEach(b => b.classList.remove('active-operator'));
    if (op) {
        document.querySelectorAll(`[data-action="operator"][data-val="${op}"]`).forEach(b => {
            if (b.closest('.calc-screen')?.classList.contains('active'))
                b.classList.add('active-operator');
        });
    }
}

// ─────────────────────────────────────────────
// 9. Input Handlers
// ─────────────────────────────────────────────
function inputDigit(digit) {
    setActiveOperator(null);
    if (state.isEvaluated) { state.formula = ''; state.display = ''; state.isEvaluated = false; }

    if (state.display === '0' && digit !== '.') {
        state.display = digit;
    } else {
        if (digit === '.') {
            const parts = state.display.split(/[+\-*/÷×−^]/);
            if (parts[parts.length - 1].includes('.')) return;
        }
        state.display += digit;
    }
    updateDisplay();
}

function inputOperator(op) {
    if (state.isEvaluated) { state.formula = state.display; state.isEvaluated = false; }

    const last = state.display.slice(-1);
    const ops  = ['+', '-', '*', '/', '÷', '×', '−', '^'];

    if (!state.display || state.display === '0') {
        if (op === '-') { state.display = '-'; updateDisplay(); return; }
        return;
    }
    if (ops.includes(last)) {
        state.display = state.display.slice(0, -1) + op;
    } else {
        state.display += op;
    }
    setActiveOperator(op);
    updateDisplay();
}

function inputParenthesis() {
    if (state.isEvaluated) { state.formula = ''; state.display = ''; state.isEvaluated = false; }

    const opens  = (state.display.match(/\(/g) || []).length;
    const closes = (state.display.match(/\)/g) || []).length;
    const last   = state.display.slice(-1);

    if (!state.display || state.display === '0') {
        state.display = '(';
    } else if (['+', '-', '*', '/', '÷', '×', '−', '(', '^'].includes(last)) {
        state.display += '(';
    } else if (opens > closes) {
        state.display += ')';
    } else {
        state.display += '(';
    }
    updateDisplay();
}

function inputScientific(val) {
    if (state.isEvaluated) { state.formula = ''; state.isEvaluated = false; }

    switch (val) {
        case 'deg':
            state.degMode = !state.degMode;
            const degBtn = document.querySelector('[data-val="deg"]');
            if (degBtn) {
                degBtn.innerText = state.degMode ? 'Deg' : 'Rad';
                degBtn.style.color = state.degMode ? '' : '#ffb74d';
            }
            return;
        case 'pi':
            state.display = (state.display === '0') ? 'π' : state.display + 'π';
            break;
        case 'e':
            state.display = (state.display === '0') ? 'e' : state.display + 'e';
            break;
        case 'sin': case 'cos': case 'tan': case 'ln': case 'log': case 'sqrt':
            state.display = (state.display === '0') ? val + '(' : state.display + val + '(';
            break;
        case 'pow':
            state.display += '^';
            break;
        case 'factorial':
            state.display += '!';
            // Replace trailing number followed by ! with fact(number)
            state.display = state.display.replace(/(\d+\.?\d*)!$/, 'fact($1)');
            break;
        case 'exp':
            state.display = (state.display === '0') ? 'exp(' : state.display + 'exp(';
            break;
        case 'rand':
            state.display = (state.display === '0') ? 'rand()' : state.display + 'rand()';
            break;
        case 'paren':
            inputParenthesis();
            return;
    }
    updateDisplay();
}

// ─────────────────────────────────────────────
// 10. Main Action Router
// ─────────────────────────────────────────────
function handleAction(action, val) {
    switch (action) {
        case 'clear':
            state.formula = ''; state.display = '0';
            state.isEvaluated = false;
            setActiveOperator(null);
            updateDisplay();
            break;

        case 'backspace':
            if (state.display.length > 1) state.display = state.display.slice(0, -1);
            else state.display = '0';
            updateDisplay();
            break;

        case 'percent':
            if (state.display && state.display !== '0') {
                state.display += '%';
                updateDisplay();
            }
            break;

        case 'operator':
            inputOperator(val);
            break;

        case 'sci':
            inputScientific(val);
            break;

        case 'calculate':
            if (!state.display || state.display === 'Error') return;
            state.formula = state.display;
            const res = calculateFormula(state.display);
            state.display = String(res);
            state.isEvaluated = true;
            setActiveOperator(null);
            updateDisplay();
            if (res !== 'Error') addToHistory(state.formula, state.display);
            break;

        default:
            inputDigit(val);
    }
}

// ─────────────────────────────────────────────
// 11. Button Event Binding
// ─────────────────────────────────────────────
function createRipple(e, btn) {
    btn.querySelectorAll('.ripple-element').forEach(r => r.remove());
    const ripple = document.createElement('span');
    ripple.classList.add('ripple-element');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = (e.clientX ? e.clientX - rect.left : rect.width  / 2) - size / 2;
    const y = (e.clientY ? e.clientY - rect.top  : rect.height / 2) - size / 2;
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
}

function bindButtons() {
    document.querySelectorAll('.btn').forEach(btn => {
        // Remove previous listeners by cloning
        const fresh = btn.cloneNode(true);
        btn.parentNode.replaceChild(fresh, btn);
    });
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', e => {
            handleAction(btn.dataset.action, btn.dataset.val);
            playClickSound();
            createRipple(e, btn);
        });
    });
}

// ─────────────────────────────────────────────
// 12. Keyboard Support
// ─────────────────────────────────────────────
window.addEventListener('keydown', e => {
    if (document.activeElement.tagName === 'INPUT' && document.activeElement.type !== 'checkbox'
        && document.activeElement.type !== 'range') return;
    if (document.activeElement.tagName === 'SELECT') return;

    const key = e.key;
    let action = null, val = null;

    if (/^[0-9.]$/.test(key))             { action = null;       val = key; }
    else if (key === '+')                  { action = 'operator'; val = '+'; }
    else if (key === '-')                  { action = 'operator'; val = '-'; }
    else if (key === '*')                  { action = 'operator'; val = '*'; }
    else if (key === '/')                  { action = 'operator'; val = '/'; e.preventDefault(); }
    else if (key === 'Enter' || key === '='){ action = 'calculate'; val = null; e.preventDefault(); }
    else if (key === 'Backspace')          { action = 'backspace'; val = null; }
    else if (key === 'Escape')             { action = 'clear';     val = null; }
    else if (key === '%')                  { action = 'percent';   val = null; }
    else if (key === '(' || key === ')')   { action = 'sci';      val = 'paren'; }
    else if (key === '^')                  { action = 'sci';      val = 'pow'; }
    else return;

    handleAction(action, val);
    playClickSound();
});

// ─────────────────────────────────────────────
// 13. Bootstrap
// ─────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadHistory();
    bindButtons();
    updateDisplay();
});
