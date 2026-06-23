import React, { useState, useRef, useEffect } from "react";

const ImageEditorModal = ({
  isOpen,
  imageSrc,
  title,
  defaultAspect = 1,
  onClose,
  onConfirm,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(defaultAspect);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Set default aspect when defaultAspect changes
  useEffect(() => {
    setAspectRatio(defaultAspect);
  }, [defaultAspect]);

  // Reset controls when a new image is loaded
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  }, [imageSrc]);

  if (!isOpen || !imageSrc) return null;

  // Compute crop box size in screen pixels based on aspect ratio
  // Standard container size is max 400x320
  const containerWidth = 400;
  const containerHeight = 320;

  let cropWidth = 250;
  let cropHeight = 250;

  if (aspectRatio === 1) {
    cropWidth = 240;
    cropHeight = 240;
  } else if (aspectRatio === 4 / 3) {
    cropWidth = 280;
    cropHeight = 210;
  } else if (aspectRatio === 16 / 9) {
    cropWidth = 300;
    cropHeight = 168.75;
  } else if (aspectRatio === 9 / 16) {
    cropWidth = 157.5;
    cropHeight = 280;
  } else if (aspectRatio === 608 / 580) {
    // Custom Card ratio
    cropWidth = 270;
    cropHeight = 257.5;
  } else if (aspectRatio === null) {
    // Freeform - default to container max box
    cropWidth = 280;
    cropHeight = 220;
  }

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handlers
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Export cropped image using Canvas API
  const handleCropSave = () => {
    if (loading) return;
    setLoading(true);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Compute high-resolution canvas bounds
        const targetWidth = 1000; // Output width baseline
        const scaleFactor = targetWidth / cropWidth;
        canvas.width = cropWidth * scaleFactor;
        canvas.height = cropHeight * scaleFactor;

        // Fill background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Move coordinate origin to the center of the crop box
        ctx.translate(canvas.width / 2, canvas.height / 2);

        // Apply translation from panning (scaled up to high resolution)
        ctx.translate(offset.x * scaleFactor, offset.y * scaleFactor);

        // Apply rotation
        ctx.rotate((rotation * Math.PI) / 180);

        // Find scale required to fit image in container screen bounds
        const containerAspect = containerWidth / containerHeight;
        const imgAspect = img.width / img.height;
        let baseScale = 1.0;

        if (imgAspect > containerAspect) {
          // Fitted width = containerWidth
          baseScale = containerWidth / img.width;
        } else {
          // Fitted height = containerHeight
          baseScale = containerHeight / img.height;
        }

        // Apply scale (baseScale * userZoom * scaleFactor)
        const finalScale = baseScale * zoom * scaleFactor;
        ctx.scale(finalScale, finalScale);

        // Draw image centered at origin
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        onConfirm(dataUrl);
      } catch (err) {
        console.error("Cropping failed:", err);
        toast.error("Failed to crop image. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    img.onerror = () => {
      toast.error("Failed to load image for cropping.");
      setLoading(false);
    };
    img.src = imageSrc;
  };

  return (
    <div className="fixed inset-0 bg-[#070A13]/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0D1220] border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#070A13]/30">
          <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#D8B76A]">
            {title || "Crop & Edit Photo"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Canvas / Image preview area */}
        <div className="relative p-6 flex justify-center items-center bg-black/40">
          <div
            ref={containerRef}
            style={{ width: `${containerWidth}px`, height: `${containerHeight}px` }}
            className="relative overflow-hidden bg-zinc-950/80 rounded-xl border border-white/5 flex items-center justify-center select-none touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* The Image being transformed */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Editor Source"
              draggable="false"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
                transition: isDragging ? "none" : "transform 0.15s ease-out",
                cursor: isDragging ? "grabbing" : "grab",
                maxHeight: "100%",
                maxWidth: "100%",
                objectFit: "contain",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />

            {/* Darkened overlay mask with clear crop box cut-out */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className="border border-[#D8B76A] shadow-[0_0_0_9999px_rgba(7,10,19,0.7)] relative"
                style={{
                  width: `${cropWidth}px`,
                  height: `${cropHeight}px`,
                }}
              >
                {/* Visual grid overlay guidelines (Rule of thirds) */}
                <div className="absolute inset-0 grid grid-cols-3 pointer-events-none opacity-20">
                  <div className="border-r border-dashed border-white h-full" />
                  <div className="border-r border-dashed border-white h-full" />
                  <div className="h-full" />
                </div>
                <div className="absolute inset-0 grid grid-rows-3 pointer-events-none opacity-20">
                  <div className="border-b border-dashed border-white w-full" />
                  <div className="border-b border-dashed border-white w-full" />
                  <div className="w-full" />
                </div>
                {/* Corner accent decorations */}
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#D8B76A]" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#D8B76A]" />
                <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#D8B76A]" />
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#D8B76A]" />
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar & Controls */}
        <div className="p-5 space-y-4 bg-[#0D1220]">
          {/* Aspect Ratios Selection */}
          <div>
            <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-2 font-bold">
              Aspect Ratio
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Freeform", ratio: null },
                { label: "1:1 Square", ratio: 1 },
                { label: "4:3", ratio: 4 / 3 },
                { label: "16:9", ratio: 16 / 9 },
                { label: "9:16", ratio: 9 / 16 },
                { label: "Card Frame", ratio: 608 / 580 },
              ].map((aspect) => (
                <button
                  key={aspect.label}
                  type="button"
                  onClick={() => setAspectRatio(aspect.ratio)}
                  className={`text-[9px] font-semibold px-2 py-1 rounded-md border transition cursor-pointer ${
                    aspectRatio === aspect.ratio
                      ? "bg-[#D8B76A]/10 text-[#D8B76A] border-[#D8B76A]/40"
                      : "bg-white/3 text-white/50 border-white/10 hover:bg-white/5"
                  }`}
                >
                  {aspect.label}
                </button>
              ))}
            </div>
          </div>

          {/* Slider for Zoom & buttons for rotate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Zoom Slider */}
            <div>
              <div className="flex justify-between text-[9px] uppercase tracking-wider text-white/45 mb-1.5">
                <span>Zoom Scale</span>
                <span className="font-mono text-[#D8B76A]">{zoom.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#D8B76A]"
              />
            </div>

            {/* Rotate buttons */}
            <div>
              <span className="text-[9px] uppercase tracking-wider text-white/45 block mb-1.5">
                Rotate Image
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev - 90) % 360)}
                  className="flex-1 py-1.5 rounded-lg border border-white/10 bg-white/3 hover:bg-white/5 text-[10px] text-white/80 font-bold transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>↺</span> 90° Left
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="flex-1 py-1.5 rounded-lg border border-white/10 bg-white/3 hover:bg-white/5 text-[10px] text-white/80 font-bold transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>↻</span> 90° Right
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-white/5 bg-[#070A13]/40 flex justify-end gap-3.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCropSave}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#D8B76A] hover:bg-[#D8B76A]/90 text-[#070A13] transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <span className="animate-spin text-sm">🌀</span>
                <span>Saving Crop...</span>
              </>
            ) : (
              <span>Save & Crop</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorModal;
