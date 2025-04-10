/**
 * Node canvas factory for PDF.js
 * This allows PDF.js to render PDFs on the server side
 */

// Define the NodeCanvasFactory class
export class NodeCanvasFactory {
  create(width: number, height: number) {
    // We don't actually need to create a canvas for text extraction
    // This is just a stub to make PDF.js happy
    return {
      width,
      height,
      getContext: () => ({
        // Minimal canvas context implementation
        // Just enough to make PDF.js work for text extraction
        _operationsQueue: [],
        rect: () => {},
        fillRect: () => {},
        drawImage: () => {},
        fill: () => {},
        stroke: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        save: () => {},
        restore: () => {},
        transform: () => {},
        scale: () => {},
        rotate: () => {},
        translate: () => {},
        clip: () => {},
        createImageData: () => ({ data: new Uint8Array(0) }),
        getImageData: () => ({ data: new Uint8Array(0) }),
        putImageData: () => {},
      }),
      toBuffer: () => Buffer.alloc(0),
    };
  }

  reset() {
    // Nothing to reset
  }

  destroy() {
    // Nothing to destroy
  }
}
