/**
 * ==========================================================================
 * Colorblind Test Generator - Circle Packing Engine
 * ==========================================================================
 */

import { getRelativeLuminance, matchLuminance } from './color-utils.js';

export class CirclePacker {
    constructor(width, height, plateRadiusFactor = 0.92) {
        this.width = width;
        this.height = height;
        this.cx = width / 2;
        this.cy = height / 2;
        this.plateRadius = (Math.min(width, height) / 2) * plateRadiusFactor;
    }

    /**
     * Packs non-overlapping circles tightly within the circular plate boundary
     * using a high-density Greedy algorithm with spatial gap maintenance.
     * 
     * @param {SymbolRenderer} symbolRenderer Cache-loaded mask canvas wrapper
     * @param {Object} palette Palette object containing symbolColors and backgroundColors arrays
     * @param {number} maxAttempts Maximum insertion attempts (density factor)
     * @param {number} minR Minimum circle radius (px)
     * @param {number} maxR Maximum circle radius (px)
     * @returns {Array} Array of packed circle objects with assigned colors and luminance
     */
    generate(symbolRenderer, palette, maxAttempts = 6000, minR = 2.5, maxR = 9) {
        const circles = [];
        const padding = 0.8; // px of spacing between circles to keep them visually distinct
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Generate a random position inside the circular plate boundary
            // We use standard uniform disc sampling: r = sqrt(rand) * R
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.sqrt(Math.random()) * (this.plateRadius - minR);
            const x = this.cx + Math.cos(angle) * dist;
            const y = this.cy + Math.sin(angle) * dist;

            // Distance to boundary check
            const distToBoundary = this.plateRadius - dist;
            if (distToBoundary < minR) continue;

            let maxAllowedR = Math.min(maxR, distToBoundary);
            let isValidPlacement = true;

            // Collision check against existing circles
            for (let i = 0; i < circles.length; i++) {
                const other = circles[i];
                const dx = x - other.x;
                const dy = y - other.y;
                const distBetweenCenters = Math.sqrt(dx * dx + dy * dy);

                // If point is inside an existing circle, fail immediately
                if (distBetweenCenters <= other.r + padding) {
                    isValidPlacement = false;
                    break;
                }

                // Calculate maximum radius before collision with this specific circle
                const allowedByCircle = distBetweenCenters - other.r - padding;
                if (allowedByCircle < minR) {
                    isValidPlacement = false;
                    break;
                }

                if (allowedByCircle < maxAllowedR) {
                    maxAllowedR = allowedByCircle;
                }
            }

            if (!isValidPlacement) continue;

            // Determine radius (greedy assignment, slightly biased to be larger for better density)
            const r = minR + Math.random() * (maxAllowedR - minR);

            // Determine if the center falls inside the symbol mask
            const isSymbol = symbolRenderer.isInsideSymbol(x, y);

            // Fetch a random base color from the appropriate list
            const colorList = isSymbol ? palette.symbolColors : palette.backgroundColors;
            const originalColor = colorList[Math.floor(Math.random() * colorList.length)];
            
            // Calculate absolute relative luminance of original color
            const luminance = getRelativeLuminance(originalColor[0], originalColor[1], originalColor[2]);

            // Pre-calculate equalized color for instantaneous view toggling
            let equalizedColor;
            if (isSymbol) {
                // If it's a symbol circle (e.g. orange), we want to make it look like a background circle (e.g. green)
                // Pick a random background color as the hue foundation
                const baseGreen = palette.backgroundColors[Math.floor(Math.random() * palette.backgroundColors.length)];
                // Align its luminance perfectly with the orange luminance
                equalizedColor = matchLuminance(luminance, baseGreen);
            } else {
                // Background circle stays itself in the equalized green plate
                equalizedColor = [...originalColor];
            }

            circles.push({
                x,
                y,
                r,
                isSymbol,
                originalColor,
                equalizedColor,
                luminance
            });
        }

        return circles;
    }
}
