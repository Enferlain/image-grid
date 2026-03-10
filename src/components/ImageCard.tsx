import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Edit2, Check } from 'lucide-react';
import type { GridImage, GridSettings } from '../types';
import { cn } from '../lib/utils';

interface ImageCardProps {
  image: GridImage;
  settings: GridSettings;
  columnCount: number;
  onDelete: (id: string) => void;
  onTitleChange: (id: string, newTitle: string) => void;
  isExporting: boolean;
}

export function ImageCard({
  image,
  settings,
  columnCount,
  onDelete,
  onTitleChange,
  isExporting,
}: ImageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(image.title);

  // Scale font based on column count. At 3 columns = full size. More columns = smaller.
  const scale = Math.min(1, 3 / Math.max(1, columnCount));
  const scaledFontSize = Math.max(2, settings.titleFontSize * scale);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
    ...(settings.layoutMode === 'strip' ? {
      flex: `0 0 ${settings.stripImageWidth}px`,
      width: `${settings.stripImageWidth}px`,
      scrollSnapAlign: 'start',
    } : {})
  };

  const handleSaveTitle = () => {
    onTitleChange(image.id, editTitle);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditTitle(image.title);
      setIsEditing(false);
    }
  };

  const renderTitle = (position: 'top' | 'bottom' | 'overlay') => {
    if (!settings.showTitles || settings.titlePosition !== position) return null;

    return (
      <div
        className={cn(
          "flex items-center justify-center w-full overflow-hidden",
          position === 'overlay' && "absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm z-10"
        )}
        style={{ padding: `${Math.max(0, 2 * scale)}px 0` }}
      >
        {isEditing && !isExporting ? (
          <div className="flex items-center gap-1 w-full px-1">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveTitle}
              autoFocus
              className="flex-1 bg-white/10 border border-white/20 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-0"
              style={{ color: settings.titleColor, fontSize: `${scaledFontSize}px` }}
            />
            <button
              onClick={handleSaveTitle}
              className="p-1 text-green-500 hover:bg-white/10 rounded shrink-0"
            >
              <Check size={Math.max(8, 14 * scale)} />
            </button>
          </div>
        ) : (
          <div className="flex items-center group/title w-full justify-center overflow-hidden">
            <span
              className="text-center font-medium w-full"
              style={{
                color: settings.titleColor,
                fontSize: `${scaledFontSize}px`,
                lineHeight: 1.2,
                overflow: 'hidden',
                wordBreak: 'break-all',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
              title={image.title}
            >
              {image.title}
            </span>
            {!isExporting && (
              <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover/title:opacity-100 p-0.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all shrink-0"
              >
                <Edit2 size={Math.max(8, 12 * scale)} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group flex flex-col",
        isDragging && "shadow-2xl ring-2 ring-indigo-500"
      )}
    >
      {renderTitle('top')}

      {/* Image Container */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: settings.aspectRatio === 'auto' ? undefined : settings.aspectRatio,
          borderRadius: `${settings.borderRadius}px`,
          borderWidth: `${settings.borderWidth}px`,
          borderColor: settings.borderColor,
          backgroundColor: settings.objectFit === 'contain' ? '#00000010' : 'transparent',
        }}
      >
        <img
          src={image.url}
          alt={image.title}
          className="w-full h-full"
          style={{ objectFit: settings.objectFit }}
          draggable={false}
        />
        
        {renderTitle('overlay')}

        {/* Hover Controls (Hidden during export) */}
        {!isExporting && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-between p-2 pointer-events-none z-20">
            <div
              {...attributes}
              {...listeners}
              className="p-1.5 bg-black/50 hover:bg-black/70 rounded-md cursor-grab active:cursor-grabbing text-white backdrop-blur-sm pointer-events-auto shadow-sm"
            >
              <GripVertical size={18} />
            </div>
            <button
              onClick={() => onDelete(image.id)}
              className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-md text-white backdrop-blur-sm transition-colors pointer-events-auto shadow-sm"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {renderTitle('bottom')}
    </div>
  );
}
