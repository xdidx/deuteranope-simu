/**
 * ==========================================================================
 * Colorblind Test Generator - Color Utilities & Simulations
 * ==========================================================================
 */

// sRGB to Linear conversion
export function sRGBtoLinear(c) {
    const val = c / 255;
    return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
}

// Linear to sRGB conversion
export function linearToSRGB(c) {
    const val = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(val * 255)));
}

/**
 * Calculates the relative luminance of an sRGB color.
 * L = 0.2126 * R_linear + 0.7152 * G_linear + 0.0722 * B_linear
 */
export function getRelativeLuminance(r, g, b) {
    const r_lin = sRGBtoLinear(r);
    const g_lin = sRGBtoLinear(g);
    const b_lin = sRGBtoLinear(b);
    return 0.2126 * r_lin + 0.7152 * g_lin + 0.0722 * b_lin;
}

/**
 * Adjusts a base color's luminance to match a target luminance precisely
 * while keeping the relative color ratios (hue and saturation) intact.
 */
export function matchLuminance(targetLuminance, baseRGB) {
    const r_lin = sRGBtoLinear(baseRGB[0]);
    const g_lin = sRGBtoLinear(baseRGB[1]);
    const b_lin = sRGBtoLinear(baseRGB[2]);
    const baseL = 0.2126 * r_lin + 0.7152 * g_lin + 0.0722 * b_lin;

    if (baseL === 0) {
        // If black, blend with some target-matching grey
        const grey_val = linearToSRGB(targetLuminance);
        return [grey_val, grey_val, grey_val];
    }

    const k = targetLuminance / baseL;
    let r_new_lin = r_lin * k;
    let g_new_lin = g_lin * k;
    let b_new_lin = b_lin * k;

    // Gamut mapping if value goes out of bounds (> 1.0)
    const max_comp = Math.max(r_new_lin, g_new_lin, b_new_lin);
    if (max_comp > 1.0) {
        r_new_lin /= max_comp;
        g_new_lin /= max_comp;
        b_new_lin /= max_comp;
        
        // Add a bit of desaturating white to match the remaining luminance if needed
        const currentL = 0.2126 * r_new_lin + 0.7152 * g_new_lin + 0.0722 * b_new_lin;
        const l_diff = targetLuminance - currentL;
        if (l_diff > 0) {
            r_new_lin = Math.min(1.0, r_new_lin + l_diff);
            g_new_lin = Math.min(1.0, g_new_lin + l_diff);
            b_new_lin = Math.min(1.0, b_new_lin + l_diff);
        }
    }

    return [
        linearToSRGB(r_new_lin),
        linearToSRGB(g_new_lin),
        linearToSRGB(b_new_lin)
    ];
}

/**
 * Simulates Deuteranopia / Deuteranomaly in the RGB space using a high-fidelity
 * linear RGB matrix transform based on Brettel's dichromacy model.
 * @param {number} r Red channel (0-255)
 * @param {number} g Green channel (0-255)
 * @param {number} b Blue channel (0-255)
 * @param {number} severity Anomaly severity from 0.0 (normal) to 1.0 (dichromat)
 */
export function simulateDeuteranopia(r, g, b, severity = 1.0) {
    // Brettel/Viénot linear sRGB approximation matrix:
    const r_sim = 0.625 * r + 0.375 * g;
    const g_sim = 0.700 * r + 0.300 * g;
    const b_sim = 0.300 * g + 0.700 * b;

    // Interpolate between original and simulated color based on severity
    const out_r = r * (1 - severity) + r_sim * severity;
    const out_g = g * (1 - severity) + g_sim * severity;
    const out_b = b * (1 - severity) + b_sim * severity;

    return [
        Math.max(0, Math.min(255, Math.round(out_r))),
        Math.max(0, Math.min(255, Math.round(out_g))),
        Math.max(0, Math.min(255, Math.round(out_b)))
    ];
}

/**
 * Color palettes tailored for Ishihara plate generation.
 * Includes overlapping luminance ranges between Symbol and Background.
 */
export const PALETTES = {
    'deutan-standard': {
        name: 'Standard (Rouge-Orange sur Vert)',
        symbolColors: [
            [225, 85, 65],   // Orange vif
            [238, 120, 92],  // Saumon clair
            [191, 75, 53],   // Rouge rouille
            [215, 105, 80],  // Corail chaleureux
            [145, 60, 45],   // Brun-rouge foncé
            [242, 148, 120]  // Pêche claire
        ],
        backgroundColors: [
            [75, 125, 85],   // Vert feuillage moyen
            [120, 165, 115], // Vert sauge doux
            [50, 100, 68],   // Vert mousse foncé
            [148, 188, 138], // Vert clair jaunâtre
            [65, 120, 105],  // Vert sarcelle
            [110, 150, 135]  // Vert bleuâtre doux
        ]
    },
    'deutan-reverse': {
        name: 'Inversée (Vert sur Rouge-Orange)',
        // Just swaps symbol and background of standard deutan
        symbolColors: [
            [75, 125, 85],
            [120, 165, 115],
            [50, 100, 68],
            [148, 188, 138],
            [65, 120, 105],
            [110, 150, 135]
        ],
        backgroundColors: [
            [225, 85, 65],
            [238, 120, 92],
            [191, 75, 53],
            [215, 105, 80],
            [145, 60, 45],
            [242, 148, 120]
        ]
    },
    'tritan': {
        name: 'Tritan (Bleu sur Rose-Violet)',
        symbolColors: [
            [50, 95, 160],   // Bleu azur
            [75, 130, 210],  // Bleu ciel
            [30, 70, 130],   // Bleu marine
            [100, 160, 230], // Bleu pastel
            [50, 110, 180]   // Bleu moyen
        ],
        backgroundColors: [
            [190, 75, 150],  // Rose fuchsia
            [215, 115, 180], // Violet-rose clair
            [140, 50, 110],  // Prune foncé
            [225, 145, 195], // Rose dragée
            [165, 80, 140]   // Magenta doux
        ]
    }
};

/**
 * Utility to convert an RGB array to CSS color string.
 */
export function rgbToCss(rgb) {
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}
