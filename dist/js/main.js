/**
 * ==========================================================================
 * Colorblind Test Generator - Main Application Coordinator
 * ==========================================================================
 */

import { PALETTES, getRelativeLuminance } from './color-utils.js';
import { SymbolRenderer } from './symbol-renderer.js';
import { CirclePacker } from './circle-packing.js';

// Global App State
const state = {
    currentCircles: [],
    viewMode: 'simulated', // 'normal' | 'simulated' | 'equalized'
    paletteId: 'deutan-reverse',
    symbolType: 'text', // 'text' | 'shape' | 'draw'
    symbolText: '5',
    fontFamily: 'Arial, sans-serif',
    shapeType: 'heart',
    blurAmount: 2,
    density: 6000,
    minR: 2.5,
    maxR: 9,
    severity: 80, // 0-100%
    alwaysRandomize: false,
    darkTransformRate: 30
};

// UI Elements & Canvas Helpers
let canvas, ctx;
let symbolRenderer;
let circlePacker;

document.addEventListener('DOMContentLoaded', () => {
    initCanvas();
    initSketchpad();
    bindEvents();
    
    // Automatically trigger initial plate generation on load
    generatePlate();
});

function initCanvas() {
    canvas = document.getElementById('ishihara-canvas');
    ctx = canvas.getContext('2d');
    
    const size = 450;
    
    // Support High-DPI screens for super sharp circles
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);
    
    symbolRenderer = new SymbolRenderer(size, size);
    circlePacker = new CirclePacker(size, size);
}

/**
 * Initializes the Interactive sketchpad for freehand drawing of custom masks
 */
function initSketchpad() {
    const pad = document.getElementById('sketchpad');
    const pCtx = pad.getContext('2d');
    
    // Fill background with solid black
    pCtx.fillStyle = '#000000';
    pCtx.fillRect(0, 0, pad.width, pad.height);
    
    let isDrawing = false;
    
    function getCoords(e) {
        const rect = pad.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: ((clientX - rect.left) / rect.width) * pad.width,
            y: ((clientY - rect.top) / rect.height) * pad.height
        };
    }
    
    function startDraw(e) {
        isDrawing = true;
        const coords = getCoords(e);
        pCtx.beginPath();
        pCtx.moveTo(coords.x, coords.y);
        pCtx.strokeStyle = '#ffffff';
        pCtx.lineWidth = 14;
        pCtx.lineCap = 'round';
        pCtx.lineJoin = 'round';
        e.preventDefault();
    }
    
    function draw(e) {
        if (!isDrawing) return;
        const coords = getCoords(e);
        pCtx.lineTo(coords.x, coords.y);
        pCtx.stroke();
        e.preventDefault();
    }
    
    function endDraw() {
        isDrawing = false;
    }
    
    pad.addEventListener('mousedown', startDraw);
    pad.addEventListener('mousemove', draw);
    pad.addEventListener('mouseup', endDraw);
    pad.addEventListener('mouseout', endDraw);
    
    // Mobile Touch events
    pad.addEventListener('touchstart', startDraw, { passive: false });
    pad.addEventListener('touchmove', draw, { passive: false });
    pad.addEventListener('touchend', endDraw);
    
    document.getElementById('clear-sketchpad').addEventListener('click', () => {
        pCtx.fillStyle = '#000000';
        pCtx.fillRect(0, 0, pad.width, pad.height);
    });
}

function bindEvents() {
    // 1. Tab Switching for Symbol Types
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const targetTab = tab.getAttribute('data-tab');
            state.symbolType = targetTab;
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`tab-${targetTab}`).classList.add('active');
        });
    });

    // 2. Shape Selector Buttons
    const shapeBtns = document.querySelectorAll('.shape-btn');
    shapeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            shapeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.shapeType = btn.getAttribute('data-shape');
        });
    });

    // 3. Palette Selectors
    const paletteOptions = document.querySelectorAll('.palette-option');
    paletteOptions.forEach(option => {
        option.addEventListener('click', () => {
            paletteOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            state.paletteId = option.getAttribute('data-palette');
        });
    });

    // 4. Accordion Toggle for Advanced Settings
    const accToggle = document.querySelector('.accordion-toggle');
    const accContent = document.querySelector('.accordion-content');
    accToggle.addEventListener('click', () => {
        accContent.classList.toggle('open');
        accToggle.innerHTML = accContent.classList.contains('open') ? 'Paramètres Avancés ▴' : 'Paramètres Avancés ▾';
    });

    // 5. Input Synchronization
    const densityInput = document.getElementById('circle-density');
    const densityVal = document.getElementById('density-val');
    densityInput.addEventListener('input', () => {
        state.density = parseInt(densityInput.value);
        densityVal.textContent = state.density;
    });

    const blurInput = document.getElementById('blur-amount');
    const blurVal = document.getElementById('blur-val');
    blurInput.addEventListener('input', () => {
        state.blurAmount = parseInt(blurInput.value);
        blurVal.textContent = `${state.blurAmount}px`;
    });

    const radiusMinInput = document.getElementById('radius-min');
    radiusMinInput.addEventListener('change', () => {
        state.minR = Math.max(1, parseFloat(radiusMinInput.value));
    });

    const radiusMaxInput = document.getElementById('radius-max');
    radiusMaxInput.addEventListener('change', () => {
        state.maxR = Math.max(state.minR + 1, parseFloat(radiusMaxInput.value));
    });

    const textInput = document.getElementById('symbol-text');
    textInput.addEventListener('input', () => {
        state.symbolText = textInput.value;
    });

    const fontSelect = document.getElementById('font-family');
    fontSelect.addEventListener('change', () => {
        state.fontFamily = fontSelect.value;
    });

    // 6. View Mode Toggles
    const viewModeBtns = document.querySelectorAll('.view-mode-btn');
    viewModeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewModeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            state.viewMode = btn.getAttribute('data-mode');
            
            // Toggle visibility of the simulation slider
            const sliderContainer = document.getElementById('simulation-slider-container');
            if (state.viewMode === 'simulated') {
                sliderContainer.classList.remove('hidden-control');
            } else {
                sliderContainer.classList.add('hidden-control');
            }
            
            updateExplanation();
            drawPlateOnCanvas();
        });
    });

    // 7. Severity Slider
    const severitySlider = document.getElementById('severity-slider');
    const severityVal = document.getElementById('severity-val');
    severitySlider.addEventListener('input', () => {
        state.severity = parseInt(severitySlider.value);
        severityVal.textContent = `${state.severity}% (${state.severity === 100 ? 'Deutéranopie' : 'Deutéranomalie'})`;
        drawPlateOnCanvas();
    });

    // 8. Generate Button Click
    document.getElementById('generate-plate').addEventListener('click', generatePlate);

    // 8b. Randomize options
    document.getElementById('randomize-text').addEventListener('click', randomizeSymbolInput);
    
    const alwaysRandomizeCheckbox = document.getElementById('always-randomize');
    alwaysRandomizeCheckbox.addEventListener('change', () => {
        state.alwaysRandomize = alwaysRandomizeCheckbox.checked;
    });

    const darkTransformSlider = document.getElementById('dark-transform-slider');
    const darkTransformVal = document.getElementById('dark-transform-val');
    darkTransformSlider.addEventListener('input', () => {
        state.darkTransformRate = parseInt(darkTransformSlider.value);
        darkTransformVal.textContent = `${state.darkTransformRate}%`;
        drawPlateOnCanvas();
    });

    // 9. Download PNG Button Click
    document.getElementById('download-plate').addEventListener('click', downloadPlate);

    // 10. Luminance Test Button Click
    document.getElementById('console-test').addEventListener('click', runLuminanceValidation);
}

/**
 * Picks a random single/double digit or letter inspired by classic Ishihara plates
 */
function getRandomSymbol() {
    const symbols = ['2', '3', '5', '6', '7', '8', '9', '12', '15', '16', '26', '29', '35', '42', '45', '73', '74', 'A', 'E', 'H', 'K', 'L', 'N', 'R', 'X', 'Y'];
    return symbols[Math.floor(Math.random() * symbols.length)];
}

/**
 * Mutates the input and global state to a new random symbol
 */
function randomizeSymbolInput() {
    const nextSymbol = getRandomSymbol();
    state.symbolText = nextSymbol;
    const textInput = document.getElementById('symbol-text');
    if (textInput) {
        textInput.value = nextSymbol;
    }
}

/**
 * Renders the chosen symbol, packs the circles, and paints the canvas.
 * Handles blocking delays gracefully with loading indicators.
 */
function generatePlate() {
    // If alwaysRandomize is checked and we are in the text tab, randomize character before generating
    if (state.symbolType === 'text' && state.alwaysRandomize) {
        randomizeSymbolInput();
    }

    const genBtn = document.getElementById('generate-plate');
    const spinner = genBtn.querySelector('.spinner');
    const btnText = genBtn.querySelector('.btn-text');
    const overlay = document.getElementById('canvas-overlay');
    
    // Show Loading state
    genBtn.disabled = true;
    spinner.classList.remove('hidden');
    btnText.textContent = 'Calcul en cours...';
    overlay.classList.remove('hidden');
    
    // Defer the execution to let the browser paint the loading state first!
    setTimeout(() => {
        try {
            // 1. Draw mask on the offscreen canvas
            if (state.symbolType === 'text') {
                symbolRenderer.drawText(state.symbolText || '5', state.fontFamily);
            } else if (state.symbolType === 'shape') {
                symbolRenderer.drawShape(state.shapeType);
            } else if (state.symbolType === 'draw') {
                symbolRenderer.drawFromCanvas(document.getElementById('sketchpad'));
            }
            
            // Apply contour smoothing (blur)
            symbolRenderer.applyBlur(state.blurAmount);
            
            // Cache the pixel buffer for ultra-fast circle packing
            symbolRenderer.cachePixelBuffer();
            
            // 2. Generate Packed Circles
            const palette = PALETTES[state.paletteId];
            state.currentCircles = circlePacker.generate(
                symbolRenderer,
                palette,
                state.density,
                state.minR,
                state.maxR
            );
            
            // 3. Draw on the main high-DPI canvas
            drawPlateOnCanvas();
            
            // 4. Run automated luminance validation
            runLuminanceValidation(false);
            
        } catch (error) {
            console.error('Erreur lors de la génération de la plaque :', error);
        } finally {
            // Hide Loading state
            genBtn.disabled = false;
            spinner.classList.add('hidden');
            btnText.textContent = '🌀 Générer la Plaque';
            overlay.classList.add('hidden');
        }
    }, 50);
}

/**
 * Draws the pre-calculated circles with appropriate colors depending on viewMode
 */
function drawPlateOnCanvas() {
    if (!state.currentCircles || state.currentCircles.length === 0) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const severityFactor = state.severity / 100;
    
    for (let i = 0; i < state.currentCircles.length; i++) {
        const c = state.currentCircles[i];
        let rgb;
        
        if (state.viewMode === 'normal') {
            rgb = c.originalColor;
        } else if (state.viewMode === 'equalized') {
            rgb = c.equalizedColor;
        } else if (state.viewMode === 'simulated') {
            // Apply proportional interpolation based on dark vs light circle categories
            let interpolationFactor;
            
            if (c.isSymbol && c.luminance < 0.16) {
                // Dark symbol circles are scaled down by the darkTransformRate percentage
                interpolationFactor = severityFactor * (state.darkTransformRate / 100);
            } else {
                // Light circles or background circles undergo full main severity interpolation
                interpolationFactor = severityFactor;
            }

            rgb = [
                Math.max(0, Math.min(255, Math.round(c.originalColor[0] * (1 - interpolationFactor) + c.bgEquivalentColor[0] * interpolationFactor))),
                Math.max(0, Math.min(255, Math.round(c.originalColor[1] * (1 - interpolationFactor) + c.bgEquivalentColor[1] * interpolationFactor))),
                Math.max(0, Math.min(255, Math.round(c.originalColor[2] * (1 - interpolationFactor) + c.bgEquivalentColor[2] * interpolationFactor)))
            ];
        }
        
        ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Updates description texts dynamically depending on active display view modes
 */
function updateExplanation() {
    const box = document.getElementById('mode-explanation-box');
    
    switch (state.viewMode) {
        case 'normal':
            box.innerHTML = `<strong>Vue Normale :</strong> La plaque d'Ishihara standard. Le symbole se détache nettement en teintes chaudes (rouge/orange) sur un fond de teintes froides (vert). Pour une personne ayant une vision normale, le symbole saute aux yeux.`;
            break;
        case 'simulated':
            box.innerHTML = `<strong>Simulation de Deutéranomalie :</strong> Les verts clairs de la plaque se transforment physiquement en orange (ou inversement selon la palette) au fur et à mesure que la sévérité augmente. À 100 %, les deux couleurs fusionnent complètement en une seule teinte, ne laissant visibles que les ronds ayant un fort contraste de luminosité.`;
            break;
        case 'equalized':
            box.innerHTML = `<strong>Variante Équivalence Vert (Luminance Égalisée) :</strong> Chaque cercle orange du symbole est remplacé par un cercle vert ayant la <strong>même luminance relative exacte</strong>. Un normovoyant ne verra absolument aucun symbole (vert sur vert), tandis qu'un daltonien verra cette plaque de manière quasiment identique à la plaque originale !`;
            break;
    }
}

/**
 * Triggers a browser download of the current canvas render in PNG format.
 */
function downloadPlate() {
    if (!state.currentCircles || state.currentCircles.length === 0) return;
    
    // Create temporary link element
    const link = document.createElement('a');
    link.download = `plaque_ishihara_${state.symbolType}_${state.viewMode}.png`;
    
    // Get high-res raw data URL from the canvas
    link.href = canvas.toDataURL('image/png');
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Automated test suite that mathematically validates that our luminance matching
 * algorithm has achieved precise equivalences across replaced colors.
 * Shows output directly on the webpage interface via a nice log card.
 */
function runLuminanceValidation(userTriggered = true) {
    const logCard = document.getElementById('test-log-card');
    const logContent = document.getElementById('test-log-content');
    
    if (userTriggered) {
        logCard.classList.remove('hidden-control');
    }
    
    const circles = state.currentCircles;
    if (!circles || circles.length === 0) {
        logContent.innerHTML = `<span style="color: #ef4444;">❌ Erreur : Aucune plaque n'est générée.</span>`;
        return;
    }
    
    // Extract symbol circles
    const symbolCircles = circles.filter(c => c.isSymbol);
    
    if (symbolCircles.length === 0) {
        logContent.innerHTML = `<span style="color: #ef4444;">❌ Erreur : Le symbole est vide (aucun cercle n'a été catégorisé dans le masque).</span>`;
        return;
    }
    
    let totalDeltaL = 0;
    let maxDeltaL = 0;
    let perfectMatches = 0; // Delta L < 0.01 (excellent precision threshold)
    
    symbolCircles.forEach(c => {
        const originalL = c.luminance;
        const equalizedL = getRelativeLuminance(c.equalizedColor[0], c.equalizedColor[1], c.equalizedColor[2]);
        const delta = Math.abs(originalL - equalizedL);
        
        totalDeltaL += delta;
        if (delta > maxDeltaL) maxDeltaL = delta;
        if (delta < 0.01) perfectMatches++;
    });
    
    const avgDeltaL = totalDeltaL / symbolCircles.length;
    const successRatio = (perfectMatches / symbolCircles.length) * 100;
    
    let logHTML = `<strong>🔍 STATS AUTO-VALIDATION LUMINANCE :</strong><br>`;
    logHTML += `• Cercles analysés : ${symbolCircles.length} (masque de symbole)<br>`;
    logHTML += `• Écart de luminance moyen : <span style="color: #10b981; font-weight: bold;">${avgDeltaL.toFixed(5)}</span><br>`;
    logHTML += `• Écart de luminance max : <span style="color: #60a5fa; font-weight: bold;">${maxDeltaL.toFixed(5)}</span><br>`;
    logHTML += `• Précision de conversion (&lt;0.01) : <span style="color: #f59e0b; font-weight: bold;">${successRatio.toFixed(1)}%</span> (${perfectMatches}/${symbolCircles.length})<br>`;
    
    if (avgDeltaL < 0.005 && maxDeltaL < 0.015) {
        logHTML += `<br><span style="color: #10b981; font-weight: bold;">✅ SUCCÈS : L'égalisation de luminance relative est mathématiquement excellente ! La vision humaine ne peut déceler aucun écart de luminance trahissant le symbole.</span>`;
    } else {
        logHTML += `<br><span style="color: #fbbf24; font-weight: bold;">⚠️ ATTENTION : Écarts légers détectés suite aux contraintes d'ajustement du gamut sRGB.</span>`;
    }
    
    logContent.innerHTML = logHTML;
}
