import React, { useState } from 'react';
import { Settings, X, Download, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import { GridSettings } from '../types';
import { cn } from '../lib/utils';

interface SettingsPanelProps {
  settings: GridSettings;
  setSettings: React.Dispatch<React.SetStateAction<GridSettings>>;
  onClearAll: () => void;
  onExport: () => void;
  isExporting: boolean;
  imagesCount: number;
}

export function SettingsPanel({
  settings,
  setSettings,
  onClearAll,
  onExport,
  isExporting,
  imagesCount,
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key: keyof GridSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed top-4 right-4 z-50 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-transform duration-300 flex items-center justify-center",
          isOpen ? "translate-x-16 opacity-0 pointer-events-none" : "translate-x-0 opacity-100"
        )}
      >
        <Settings size={24} />
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-80 bg-[#0a0a0c] border-l border-white/10 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out flex flex-col overflow-hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#050506]">
          <h2 className="text-lg font-semibold text-white">Grid Settings</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-sm text-gray-300">
          {/* Layout Settings */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono tracking-widest text-indigo-400 uppercase">Layout</h3>
            
            <div className="space-y-2">
              <label className="block mb-1">Layout Mode</label>
              <div className="flex bg-[#0F0F12] border border-white/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => handleChange('layoutMode', 'grid')}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium transition-colors",
                    settings.layoutMode === 'grid' ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  Grid
                </button>
                <button
                  onClick={() => handleChange('layoutMode', 'strip')}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium transition-colors",
                    settings.layoutMode === 'strip' ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  Strip
                </button>
              </div>
            </div>

            {settings.layoutMode === 'grid' ? (
              <div className="space-y-2">
                <label className="flex justify-between items-center">
                  <span>Columns</span>
                  <div className="flex items-center gap-3">
                    <label className="text-xs flex items-center gap-1 cursor-pointer text-gray-400 hover:text-white">
                      <input
                        type="checkbox"
                        checked={settings.dynamicColumns}
                        onChange={(e) => handleChange('dynamicColumns', e.target.checked)}
                        className="rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                      />
                      Auto
                    </label>
                    <span className="text-white w-4 text-right">{settings.dynamicColumns ? (imagesCount || 1) : settings.columns}</span>
                  </div>
                </label>
                <input
                  type="range"
                  min="1"
                  max="24"
                  value={settings.dynamicColumns ? Math.max(1, imagesCount) : settings.columns}
                  onChange={(e) => {
                    handleChange('dynamicColumns', false);
                    handleChange('columns', parseInt(e.target.value));
                  }}
                  className="w-full accent-indigo-500"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex justify-between">
                  <span>Image Width (px)</span>
                  <span className="text-white">{settings.stripImageWidth}</span>
                </label>
                <input
                  type="range"
                  min="100"
                  max="800"
                  step="10"
                  value={settings.stripImageWidth}
                  onChange={(e) => handleChange('stripImageWidth', parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="flex justify-between">
                <span>Gap (px)</span>
                <span className="text-white">{settings.gap}</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.gap}
                onChange={(e) => handleChange('gap', parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block mb-1">Aspect Ratio</label>
              <select
                value={settings.aspectRatio}
                onChange={(e) => handleChange('aspectRatio', e.target.value)}
                className="w-full bg-[#0F0F12] border border-white/10 rounded-lg p-2 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="auto">Auto (Original)</option>
                <option value="1/1">1:1 (Square)</option>
                <option value="4/3">4:3</option>
                <option value="3/4">3:4</option>
                <option value="16/9">16:9</option>
                <option value="9/16">9:16</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block mb-1">Object Fit</label>
              <select
                value={settings.objectFit}
                onChange={(e) => handleChange('objectFit', e.target.value)}
                className="w-full bg-[#0F0F12] border border-white/10 rounded-lg p-2 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
              </select>
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Style Settings */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono tracking-widest text-indigo-400 uppercase">Style</h3>
            
            <div className="space-y-2">
              <label className="block mb-1">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => handleChange('backgroundColor', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                />
                <input
                  type="text"
                  value={settings.backgroundColor}
                  onChange={(e) => handleChange('backgroundColor', e.target.value)}
                  className="flex-1 bg-[#0F0F12] border border-white/10 rounded-lg p-2 text-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex justify-between">
                <span>Border Radius (px)</span>
                <span className="text-white">{settings.borderRadius}</span>
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={settings.borderRadius}
                onChange={(e) => handleChange('borderRadius', parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex justify-between">
                <span>Border Width (px)</span>
                <span className="text-white">{settings.borderWidth}</span>
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={settings.borderWidth}
                onChange={(e) => handleChange('borderWidth', parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block mb-1">Border Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.borderColor}
                  onChange={(e) => handleChange('borderColor', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                />
                <input
                  type="text"
                  value={settings.borderColor}
                  onChange={(e) => handleChange('borderColor', e.target.value)}
                  className="flex-1 bg-[#0F0F12] border border-white/10 rounded-lg p-2 text-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Titles Settings */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono tracking-widest text-indigo-400 uppercase">Titles</h3>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showTitles}
                onChange={(e) => handleChange('showTitles', e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
              />
              <span>Show Titles</span>
            </label>

            {settings.showTitles && (
              <>
                <div className="space-y-2">
                  <label className="block mb-1">Position</label>
                  <select
                    value={settings.titlePosition}
                    onChange={(e) => handleChange('titlePosition', e.target.value)}
                    className="w-full bg-[#0F0F12] border border-white/10 rounded-lg p-2 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="bottom">Below Image</option>
                    <option value="top">Above Image</option>
                    <option value="overlay">Overlay (Bottom)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block mb-1">Title Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.titleColor}
                      onChange={(e) => handleChange('titleColor', e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={settings.titleColor}
                      onChange={(e) => handleChange('titleColor', e.target.value)}
                      className="flex-1 bg-[#0F0F12] border border-white/10 rounded-lg p-2 text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex justify-between">
                    <span>Font Size (px)</span>
                    <span className="text-white">{settings.titleFontSize}</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="48"
                    value={settings.titleFontSize}
                    onChange={(e) => handleChange('titleFontSize', parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block mb-1">Auto-Title Regex (Match)</label>
                  <input
                    type="text"
                    placeholder="e.g., ^img_(\d+)"
                    value={settings.titleRegex}
                    onChange={(e) => handleChange('titleRegex', e.target.value)}
                    className="w-full bg-[#0F0F12] border border-white/10 rounded-lg p-2 text-white focus:border-indigo-500 outline-none font-mono text-xs"
                  />
                  <p className="text-xs text-gray-500">Extracts title from filename when adding images.</p>
                </div>
                
                <div className="space-y-2">
                  <label className="block mb-1">Regex Replace</label>
                  <input
                    type="text"
                    placeholder="e.g., Image $1"
                    value={settings.titleRegexReplace}
                    onChange={(e) => handleChange('titleRegexReplace', e.target.value)}
                    className="w-full bg-[#0F0F12] border border-white/10 rounded-lg p-2 text-white focus:border-indigo-500 outline-none font-mono text-xs"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/10 bg-[#050506] space-y-3">
          <button
            onClick={onExport}
            disabled={isExporting}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3)]"
          >
            <Download size={18} />
            {isExporting ? 'Exporting...' : 'Export as PNG'}
          </button>
          
          <button
            onClick={onClearAll}
            className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border border-red-500/20"
          >
            <Trash2 size={18} />
            Clear All Images
          </button>
        </div>
      </div>
      
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
