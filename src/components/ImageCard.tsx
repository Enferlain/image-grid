import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Edit2, Check } from 'lucide-react';
import { GridImage, GridSettings } from '../types';
import { cn } from '../lib/utils';

interface ImageCardProps {
  key?: React.Key;
  image: GridImage;
  settings: GridSettings;
  onDelete: (id: string) => void;
  onTitleChange: (id: string, newTitle: string) => void;
  isExporting: boolean;
}

export function ImageCard({
  image,
  settings,
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group flex flex-col overflow-hidden",
        isDragging && "shadow-2xl ring-2 ring-indigo-500"
      )}
    >
      {/* Image Container */}
      <div
        className="relative w-full overflow-hidden flex-grow"
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
        
        {/* Hover Controls (Hidden during export) */}
        {!isExporting && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-between p-2 pointer-events-none">
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

      {/* Title Area */}
      {settings.showTitles && (
        <div className="mt-2 flex items-center justify-center relative min-h-[24px]">
          {isEditing && !isExporting ? (
            <div className="flex items-center gap-1 w-full">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSaveTitle}
                autoFocus
                className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                style={{ color: settings.titleColor, fontSize: `${settings.titleFontSize}px` }}
              />
              <button
                onClick={handleSaveTitle}
                className="p-1 text-green-500 hover:bg-white/10 rounded"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group/title w-full justify-center">
              <span
                className="truncate text-center font-medium"
                style={{ color: settings.titleColor, fontSize: `${settings.titleFontSize}px` }}
                title={image.title}
              >
                {image.title}
              </span>
              {!isExporting && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="opacity-0 group-hover/title:opacity-100 p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all"
                >
                  <Edit2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
