import React, { useState, useCallback, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { toPng } from 'html-to-image';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';
import { ImageCard } from './components/ImageCard';
import { SettingsPanel } from './components/SettingsPanel';
import { GridImage, GridSettings } from './types';
import { cn } from './lib/utils';

const DEFAULT_SETTINGS: GridSettings = {
  columns: 3,
  dynamicColumns: true,
  gap: 0,
  backgroundColor: '#050506',
  borderRadius: 0,
  borderWidth: 0,
  borderColor: '#ffffff',
  showTitles: true,
  titleRegex: '',
  titleRegexReplace: '',
  titleColor: '#EDEDEF',
  titleFontSize: 14,
  aspectRatio: 'auto',
  objectFit: 'cover',
};

export default function App() {
  const [images, setImages] = useState<GridImage[]>([]);
  const [settings, setSettings] = useState<GridSettings>(DEFAULT_SETTINGS);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const processFiles = useCallback((files: FileList | File[]) => {
    const newImages: GridImage[] = [];
    
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const url = URL.createObjectURL(file);
      let title = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      
      if (settings.titleRegex) {
        try {
          const regex = new RegExp(settings.titleRegex);
          if (settings.titleRegexReplace) {
            title = title.replace(regex, settings.titleRegexReplace);
          } else {
            const match = title.match(regex);
            if (match && match[1]) {
              title = match[1];
            } else if (match) {
              title = match[0];
            }
          }
        } catch (e) {
          console.error("Invalid regex", e);
        }
      }

      newImages.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url,
        filename: file.name,
        title,
      });
    });

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages]);
    }
  }, [settings.titleRegex, settings.titleRegexReplace]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input so same files can be selected again
    e.target.value = '';
  };

  const handleDelete = (id: string) => {
    setImages((prev) => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.url);
      return prev.filter(i => i.id !== id);
    });
  };

  const handleTitleChange = (id: string, newTitle: string) => {
    setImages((prev) => prev.map(img => img.id === id ? { ...img, title: newTitle } : img));
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all images?')) {
      images.forEach(img => URL.revokeObjectURL(img.url));
      setImages([]);
    }
  };

  const handleExport = async () => {
    if (images.length === 0) return;

    try {
      setIsExporting(true);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Load all images as HTMLImageElements to get natural dimensions
      const loadedImgs = await Promise.all(
        images.map(img => new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.crossOrigin = 'anonymous';
          el.onload = () => resolve(el);
          el.onerror = reject;
          el.src = img.url;
        }))
      );

      // Determine grid layout
      const cols = settings.dynamicColumns ? Math.max(1, images.length) : settings.columns;
      const rows = Math.ceil(images.length / cols);
      const gap = settings.gap;

      // Find the max natural width and height per column/row for uniform cells
      // Use the first image's natural size as baseline for all cells
      const cellNatW = loadedImgs[0].naturalWidth;
      const cellNatH = settings.aspectRatio === 'auto'
        ? loadedImgs[0].naturalHeight
        : cellNatW / parseFloat(settings.aspectRatio || '1');

      // Determine rendered cell width to perfectly match proportional DOM font size
      let renderedCellW = 200; // Fallback
      if (gridRef.current) {
        const imgElements = gridRef.current.querySelectorAll('img');
        if (imgElements.length > 0) {
          renderedCellW = imgElements[0].getBoundingClientRect().width;
        }
      }

      // Calculate title height at native resolution perfectly matching DOM proportions
      const titleScale = Math.min(1, 3 / Math.max(1, cols));
      const domFontSize = Math.max(2, settings.titleFontSize * titleScale);
      const nativeFontSize = domFontSize * (cellNatW / Math.max(1, renderedCellW));
      
      const titleHeight = settings.showTitles && settings.titlePosition !== 'overlay'
        ? nativeFontSize * 2.4 : 0; // Accommodate 2 lines of text (1.2 line height)

      // Scale gap proportionally to native resolution
      const nativeGap = settings.gap * (cellNatW / Math.max(1, renderedCellW));

      // Canvas dimensions
      const canvasW = cols * cellNatW + (cols + 1) * nativeGap;
      const canvasH = rows * (cellNatH + titleHeight) + (rows + 1) * nativeGap;

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(canvasW);
      canvas.height = Math.round(canvasH);
      const ctx = canvas.getContext('2d')!;

      // Helper function to wrap text mimicking `word-break: break-all` and `line-clamp: 2`
      const drawWrappedText = (text: string, x: number, y: number, maxWidth: number, maxLines: number, lineHeight: number) => {
        const lines: string[] = [];
        let currentLine = '';
        
        // break-all behavior: iterate char by char
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const testLine = currentLine + char;
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && i > 0) {
            lines.push(currentLine);
            currentLine = char;
            if (lines.length === maxLines) {
              // We hit the max lines before adding this line!
              break;
            }
          } else {
            currentLine = testLine;
          }
        }
        
        if (lines.length < maxLines) {
          lines.push(currentLine);
        } else {
          // If we truncated, add ellipsis to the last line
          let lastLine = lines[maxLines - 1];
          while (ctx.measureText(lastLine + '...').width > maxWidth && lastLine.length > 0) {
            lastLine = lastLine.slice(0, -1);
          }
          lines[maxLines - 1] = lastLine + '...';
        }

        // Draw the lines centered
        // Calculate starting Y to vertically center the text block
        const totalTextHeight = lines.length * lineHeight;
        const startY = y - (totalTextHeight / 2) + (lineHeight / 2);

        lines.forEach((line, index) => {
          ctx.fillText(line.trim(), x, startY + (index * lineHeight));
        });
      };

      // Background
      ctx.fillStyle = settings.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw each image
      for (let i = 0; i < images.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const imgEl = loadedImgs[i];

        const cellX = nativeGap + col * (cellNatW + nativeGap);
        const imgY = nativeGap + row * (cellNatH + titleHeight + nativeGap)
          + (settings.titlePosition === 'top' ? titleHeight : 0);

        // Draw border if configured
        if (settings.borderWidth > 0) {
          const bw = settings.borderWidth * (cellNatW / Math.max(1, renderedCellW));
          ctx.strokeStyle = settings.borderColor;
          ctx.lineWidth = bw;
          ctx.strokeRect(cellX - bw / 2, imgY - bw / 2, cellNatW + bw, cellNatH + bw);
        }

        // Draw image (cover fit: fill the cell, cropping as needed)
        const imgRatio = imgEl.naturalWidth / imgEl.naturalHeight;
        const cellRatio = cellNatW / cellNatH;
        let sx = 0, sy = 0, sw = imgEl.naturalWidth, sh = imgEl.naturalHeight;

        if (settings.objectFit === 'cover') {
          if (imgRatio > cellRatio) {
            sw = imgEl.naturalHeight * cellRatio;
            sx = (imgEl.naturalWidth - sw) / 2;
          } else {
            sh = imgEl.naturalWidth / cellRatio;
            sy = (imgEl.naturalHeight - sh) / 2;
          }
          ctx.drawImage(imgEl, sx, sy, sw, sh, cellX, imgY, cellNatW, cellNatH);
        } else if (settings.objectFit === 'contain') {
          let drawW = cellNatW, drawH = cellNatH;
          if (imgRatio > cellRatio) {
            drawH = cellNatW / imgRatio;
          } else {
            drawW = cellNatH * imgRatio;
          }
          const dx = cellX + (cellNatW - drawW) / 2;
          const dy = imgY + (cellNatH - drawH) / 2;
          ctx.drawImage(imgEl, dx, dy, drawW, drawH);
        } else {
          ctx.drawImage(imgEl, cellX, imgY, cellNatW, cellNatH);
        }

        // Draw title
        if (settings.showTitles && titleHeight > 0) {
          const titleY = settings.titlePosition === 'top'
            ? imgY - (titleHeight / 2)
            : imgY + cellNatH + (titleHeight / 2);

          ctx.fillStyle = settings.titleColor;
          ctx.font = `500 ${nativeFontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          drawWrappedText(
            images[i].title, 
            cellX + cellNatW / 2, 
            titleY, 
            cellNatW - (nativeFontSize * 0.5), // padding
            2, 
            nativeFontSize * 1.2
          );
        }

        // Overlay title
        if (settings.showTitles && settings.titlePosition === 'overlay') {
          const overlayH = nativeFontSize * 2.8;
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(cellX, imgY + cellNatH - overlayH, cellNatW, overlayH);
          
          ctx.fillStyle = settings.titleColor;
          ctx.font = `500 ${nativeFontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          drawWrappedText(
            images[i].title, 
            cellX + cellNatW / 2, 
            imgY + cellNatH - (overlayH / 2), 
            cellNatW - (nativeFontSize * 1), // padding
            2, 
            nativeFontSize * 1.2
          );
        }
      }

      // Export canvas to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `grid-${Date.now()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      console.error('Failed to export image', err);
      alert('Failed to export image. See console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#050506] text-[#EDEDEF] font-sans overflow-x-hidden"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Global Background Depth */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)] -z-10" />
      <div className="fixed inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg2NHY2NEgweiIgZmlsbD0ibm9uZSIvPPHBhdGggZD0iTTAgMGgxdjY0SDB6TTAgMGg2NHYxSDB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIi8+PC9zdmc+')] opacity-50 -z-10" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-12 border-b border-white/[0.06] bg-[#050506]/80 backdrop-blur-md z-20 flex items-center px-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
            <ImageIcon className="text-indigo-400" size={16} />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Grid Builder</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-32 px-6 w-full mx-auto min-h-screen flex flex-col">
        {images.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl bg-white/[0.02] p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <UploadCloud size={32} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Drop images here</h2>
            <p className="text-gray-400 mb-8 max-w-md">
              Drag and drop your images anywhere on the screen, or click the button below to browse files.
            </p>
            <label className="cursor-pointer px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3)]">
              <span>Browse Files</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileInput}
              />
            </label>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Export Container - This is what gets captured */}
            <div 
              className="rounded-xl transition-all duration-300"
              style={{ backgroundColor: settings.backgroundColor }}
            >
              <div
                ref={gridRef}
                className={cn(
                  "w-full",
                  settings.layoutMode === 'grid' ? "grid" : "flex overflow-x-auto snap-x snap-mandatory"
                )}
                style={{
                  ...(settings.layoutMode === 'grid' ? {
                    gridTemplateColumns: `repeat(${settings.dynamicColumns ? Math.max(1, images.length) : settings.columns}, minmax(0, 1fr))`,
                  } : {}),
                  gap: `${settings.gap}px`,
                  backgroundColor: settings.backgroundColor,
                  padding: `${settings.gap}px`, // Add padding equal to gap for outer edges
                }}
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={images.map(i => i.id)}
                    strategy={rectSortingStrategy}
                  >
                    {images.map((image) => (
                      <ImageCard
                        key={image.id}
                        image={image}
                        settings={settings}
                        columnCount={settings.dynamicColumns ? Math.max(1, images.length) : settings.columns}
                        onDelete={handleDelete}
                        onTitleChange={handleTitleChange}
                        isExporting={isExporting}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            {/* Add More Button */}
            <div className="mt-12">
              <label className="cursor-pointer px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                <UploadCloud size={20} />
                <span>Add More Images</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </label>
            </div>
          </div>
        )}
      </main>

      {/* Drag Overlay */}
      {isDraggingOver && (
        <div className="fixed inset-0 z-50 bg-indigo-500/10 backdrop-blur-sm border-4 border-indigo-500 border-dashed flex items-center justify-center pointer-events-none">
          <div className="bg-[#050506] p-6 rounded-2xl shadow-2xl border border-white/10 flex flex-col items-center">
            <UploadCloud size={48} className="text-indigo-400 mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-white">Drop to add to grid</h2>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      <SettingsPanel
        settings={settings}
        setSettings={setSettings}
        onClearAll={handleClearAll}
        onExport={handleExport}
        isExporting={isExporting}
        imagesCount={images.length}
      />
    </div>
  );
}
