/**
 * ==========================================================================
 * Colorblind Test Generator - Offscreen Mask Symbol Renderer
 * ==========================================================================
 */

export class SymbolRenderer {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // Create an offscreen canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        
        this.pixelBuffer = null;
    }

    /**
     * Clears the offscreen canvas with solid black (0,0,0)
     */
    clear() {
        this.ctx.filter = 'none';
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.pixelBuffer = null;
    }

    /**
     * Applies blurring to the offscreen canvas to smooth the edges of the mask
     */
    applyBlur(blurAmount) {
        if (blurAmount <= 0) return;
        
        // Draw the current canvas onto itself with a blur filter
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.width;
        tempCanvas.height = this.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(this.canvas, 0, 0);
        
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.filter = `blur(${blurAmount}px)`;
        this.ctx.drawImage(tempCanvas, 0, 0);
        this.ctx.filter = 'none';
    }

    /**
     * Caches the pixel data in an ArrayBuffer to allow ultra-fast coordinate checks
     */
    cachePixelBuffer() {
        this.pixelBuffer = this.ctx.getImageData(0, 0, this.width, this.height).data;
    }

    /**
     * Checks if the coordinate (x, y) lies inside the mask symbol (white pixel)
     */
    isInsideSymbol(x, y) {
        if (!this.pixelBuffer) return false;
        const ix = Math.max(0, Math.min(this.width - 1, Math.floor(x)));
        const iy = Math.max(0, Math.min(this.height - 1, Math.floor(y)));
        const index = (iy * this.width + ix) * 4;
        
        // Red channel is > 127 means it belongs to the white mask area
        return this.pixelBuffer[index] > 127;
    }

    /**
     * Renders text centered on the offscreen canvas
     */
    drawText(text, fontFamily = 'Arial, sans-serif', sizeFactor = 0.65) {
        this.clear();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const fontSize = Math.floor(this.width * sizeFactor);
        this.ctx.font = `bold ${fontSize}px ${fontFamily}`;
        
        // Draw text at center
        this.ctx.fillText(text, this.width / 2, this.height / 2 + (fontSize * 0.05)); // small vertical correction
    }

    /**
     * Renders a predefined shape centered on the offscreen canvas
     */
    drawShape(shapeType) {
        this.clear();
        this.ctx.fillStyle = '#ffffff';
        
        const cx = this.width / 2;
        const cy = this.height / 2;
        const size = this.width * 0.55;

        this.ctx.beginPath();
        switch (shapeType) {
            case 'heart':
                this.drawHeart(this.ctx, cx, cy - size/10, size, size);
                break;
            case 'star':
                this.drawStar(this.ctx, cx, cy, 5, size/2, size/4.5);
                break;
            case 'circle':
                this.ctx.arc(cx, cy, size/2, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            case 'square':
                this.drawRoundedRect(this.ctx, cx - size/2, cy - size/2, size, size, size/6);
                break;
            case 'ring':
                // Draw a donut ring using path winding rules (outer arc and inner arc reversed)
                this.ctx.arc(cx, cy, size/2, 0, Math.PI * 2, false);
                this.ctx.arc(cx, cy, size/3.5, 0, Math.PI * 2, true);
                this.ctx.fill();
                break;
            default:
                // Default to a circle if shape unrecognized
                this.ctx.arc(cx, cy, size/2, 0, Math.PI * 2);
                this.ctx.fill();
        }
    }

    /**
     * Renders custom drawings drawn on the sketchpad canvas
     */
    drawFromCanvas(sourceCanvas) {
        this.clear();
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Draw source canvas stretched to fill offscreen mask canvas
        // (Sketchpad is drawn in white on black, so it copies perfectly)
        this.ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, this.width, this.height);
    }

    /* Helper drawing routines */

    drawHeart(ctx, cx, cy, w, h) {
        ctx.moveTo(cx, cy + h / 4);
        // Left curve
        ctx.bezierCurveTo(cx, cy - h/2.2, cx - w/2, cy - h/2.2, cx - w/2, cy + h/4);
        // Bottom tip left side
        ctx.bezierCurveTo(cx - w/2, cy + (3*h)/5, cx - w/6, cy + (4*h)/5, cx, cy + h/1.1);
        // Bottom tip right side
        ctx.bezierCurveTo(cx + w/6, cy + (4*h)/5, ctx.canvas.width/2 + w/2, cy + (3*h)/5, cx + w/2, cy + h/4);
        // Right curve
        ctx.bezierCurveTo(cx + w/2, cy - h/2.2, cx, cy - h/2.2, cx, cy + h/4);
        ctx.fill();
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = (Math.PI / 2) * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }

    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }
}
