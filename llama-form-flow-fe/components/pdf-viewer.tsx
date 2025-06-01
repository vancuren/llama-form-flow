"use client"

import { useState, useEffect, useRef } from "react"
import { Maximize, Minimize, FileText, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FieldBoundingBox, FormField } from "@/components/form-flow-app"

interface PDFViewerProps {
  renderUrl: string | null
  fieldCount?: number
  currentField?: FieldBoundingBox | null
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  fields?: FormField[]
}

export function PDFViewer({
  renderUrl,
  fieldCount = 0,
  currentField = null,
  currentPage = 1,
  totalPages = 1,
  fields = [],
  onPageChange = () => {},
}: PDFViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [showFilled, setShowFilled] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Calculate appropriate scale when image loads or container size changes
  useEffect(() => {
    if (imageLoaded && containerRef.current && imageRef.current) {
      // const containerWidth = containerRef.current.clientWidth - 32 // Account for padding
      const containerWidth = containerRef.current.clientWidth // Account for padding
      const imageWidth = imageRef.current.naturalWidth

      // Calculate scale to fit image within container width
      const newScale = Math.min(1, containerWidth / imageWidth)
      setScale(newScale)
    }
  }, [imageLoaded, imageDimensions])

  // Draw highlight on canvas when currentField changes, image loads, or scale changes
  useEffect(() => {
    if (imageLoaded && currentField && canvasRef.current && imageRef.current) {
      drawHighlight()
    }
  }, [currentField, imageLoaded, scale, rotation])

  // Handle window resize to adjust canvas and scaling
  useEffect(() => {
    const handleResize = () => {
      if (imageLoaded && containerRef.current && imageRef.current) {
        // const containerWidth = containerRef.current.clientWidth - 32
        const containerWidth = containerRef.current.clientWidth
        const imageWidth = imageRef.current.naturalWidth

        // Recalculate scale
        const newScale = Math.min(1, containerWidth / imageWidth)
        setScale(newScale)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [imageLoaded])

  // Update renderUrl when page changes
  useEffect(() => {
    if (renderUrl && currentPage) {
      const baseUrl = renderUrl.split("?")[0]
      const params = new URLSearchParams(renderUrl.split("?")[1])
      params.set("page", currentPage.toString())

      if (showFilled) {
        params.set("filled", "true")
      } else {
        params.delete("filled")
      }

      const newUrl = `${baseUrl}?${params.toString()}`

      // Only reload if the URL actually changed
      if (imageRef.current && imageRef.current.src !== newUrl) {
        setImageLoaded(false)
        imageRef.current.src = newUrl
      }
    }
  }, [renderUrl, currentPage, showFilled])

  // Handle image load to get dimensions and prepare canvas
  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)

    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current
      setImageDimensions({ width: naturalWidth, height: naturalHeight })
    }
  }

  // Draw highlight rectangle on canvas
/**
 * 1) Compute the one “scale” that maps from original image pixels → displayed pixels.
 * 2) Set canvas to exactly match the displayed pixel size of the image.
 * 3) If the user rotated, apply a single rotation transform around the canvas center.
 * 4) Draw a single rectangle at [x*scale, y*scale] with size [w*scale, h*scale].
 */
const drawHighlight = () => {
  if (!canvasRef.current || !imageRef.current || !currentField) return;
  const canvas = canvasRef.current;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = imageRef.current;
  const naturalW = img.naturalWidth;   // e.g. 2550
  const naturalH = img.naturalHeight;  // e.g. 3300

  // 1) Compute scaleX = canvasWidth / naturalW (and likewise scaleY = canvasHeight / naturalH).
  //    Since we set canvasWidth = naturalW * scale earlier, this will be exactly “scale.”
  console.log("scale", scale)
  const displayedW = naturalW * scale;      // e.g. 2550 * 0.266 = ~678
  const displayedH = naturalH * scale;       // e.g. 3300 * 0.266 = ~878
  console.log("displayedW", displayedW)
  console.log("displayedH", displayedH)

  canvas.width = displayedW;
  canvas.height = displayedH;

  // 2) Clear any old drawings
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 3) If the user rotated  (0°, 90°, 180°, 270°), we rotate around the center.
  if (rotation !== 0) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
  }

  // 4) Now draw the highlight rectangle, scaled by the same factor.
  const [x, y, w, h] = currentField.bounding_box;  // e.g. [163, 157, 702, 20]
  console.log("x", x)
  console.log("y", y)
  console.log("w", w)
  console.log("h", h)

  const scaleX = canvas.width / naturalW;   // should equal “scale” exactly
  const scaleY = canvas.height / naturalH;  // should also equal “scale” exactly
  // If you want to be ultra‐safe, compute both:
  //    const scaleX = canvas.width  / naturalW;
  //    const scaleY = canvas.height / naturalH;
  // In a letter‐portrait scenario they should be identical. If not, use them separately to avoid distortion.

  const drawX = x * scaleX;
  const drawY = y * scaleY;
  const drawW = w * scaleX;
  const drawH = h * scaleY;

  // 5) Fill a translucent rectangle:
  ctx.fillStyle = "rgba(76, 175, 80, 0.3)";
  ctx.fillRect(x, y, drawW, drawH + 15);

  // 6) Draw a stronger border
  // ctx.strokeStyle = "rgba(76, 175, 80, 0.3)";
  // ctx.lineWidth = 15;
  // ctx.strokeRect(x, y, drawW, drawH);

  // 7) Put the label just above the rectangle (if there’s room)
  // if (currentField.label) {
  //   ctx.font = `bold ${12 * scaleX}px Arial`;  // 12px in original → 12 × scale
  //   ctx.fillStyle = "rgba(76, 175, 80, 1)";
  //   // We want the label’s y‐coordinate to be slightly above the top of the box, but at least 15px down:
  //   const textY = Math.max(drawY - 5 * scaleY, 15 * scaleY);
  //   ctx.fillText(currentField.label, drawX, textY);
  // }

  // 8) Restore rotation (if any)
  if (rotation !== 0) {
    ctx.restore();
  }

  // for the fields that are completed
  console.log('Running drawHighlight fields loop')
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  fields.forEach((field) => {
    console.log("field", field)
    if (field.filled) {
      // enter the text 
      ctx.font = `${25 * scaleX}px Arial`;  // 12px in original → 12 × scale
      ctx.fillStyle = "black";
      ctx.fillText(field?.value || "", field.bounding_box[0] + 10, field.bounding_box[1] + 10);
      
      const [xi, yi, wi, hi] = field.bounding_box;
      const drawXi = xi * scaleX;
      const drawYi = yi * scaleY;
      const drawWi = wi * scaleX;
      const drawHi = hi * scaleY;
      
      // ctx.fillStyle = "rgba(76, 175, 80, 0.3)";
      // ctx.fillRect(drawXi, drawYi, drawWi, drawHi + 15);
    }
  })
};


  const zoomIn = () => {
    setScale((prev) => Math.min(prev * 1.2, 2))
  }

  const zoomOut = () => {
    setScale((prev) => Math.max(prev * 0.8, 0.2))
  }

  const rotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const nextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const toggleFilledView = () => {
    setShowFilled(!showFilled)
  }

  if (!renderUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 text-gray-400">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-600" />
          <p>No form uploaded</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="flex items-center justify-between p-2 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Preview</span>
          {fieldCount > 0 && (
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">{fieldCount} fields detected</span>
          )}
          {currentField && (
            <span className="text-xs text-green-500 bg-gray-800 px-2 py-1 rounded">
              Current field: {currentField.label || currentField.inputfield}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFilledView}
            className="text-xs text-gray-400 hover:text-white"
          >
            {showFilled ? "Show Original" : "Show Filled"}
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4"
        style={{
          height: isFullscreen ? "calc(100vh - 60px)" : undefined,
          position: isFullscreen ? "fixed" : "relative",
          top: isFullscreen ? "60px" : undefined,
          left: isFullscreen ? "0" : undefined,
          right: isFullscreen ? "0" : undefined,
          bottom: isFullscreen ? "0" : undefined,
          zIndex: isFullscreen ? "50" : undefined,
          background: isFullscreen ? "rgba(17, 24, 39, 0.95)" : undefined,
        }}
      >
        {imageError ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <p>Failed to load form preview</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setImageError(false)
                  // Force reload the image
                  if (imageRef.current && renderUrl) {
                    imageRef.current.src = renderUrl
                  }
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative flex justify-center">
            <div
              className="relative"
              style={{
                width: imageDimensions.width * scale,
                height: imageDimensions.height * scale,
                transform: `rotate(${rotation}deg)`,
                transition: "transform 0.3s ease",
              }}
            >
              <img
                ref={imageRef}
                id="form-preview"
                src={renderUrl || "/placeholder.svg"}
                alt="Form Preview"
                className="border border-gray-700 rounded"
                onError={() => setImageError(true)}
                onLoad={handleImageLoad}
                style={{
                  display: imageLoaded ? "block" : "none",
                  width: imageDimensions.width * scale,
                  height: imageDimensions.height * scale,
                }}
              />
              {!imageLoaded && (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  <div className="h-8 w-8 rounded-full border-2 border-t-green-500 animate-spin" />
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  display: imageLoaded ? "block" : "none",
                  width: imageDimensions.width * scale,
                  height: imageDimensions.height * scale,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-2 border-t border-gray-800">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={prevPage} disabled={currentPage <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <Button variant="ghost" size="icon" onClick={nextPage} disabled={currentPage >= totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={zoomOut} disabled={scale <= 0.2}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-gray-400">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={zoomIn} disabled={scale >= 2}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={rotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
