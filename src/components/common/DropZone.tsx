import React, { useRef, useState } from 'react';
import { UploadCloud, FolderPlus, FilePlus, X, FileText, Film, Music, Image as ImageIcon, Archive } from 'lucide-react';
import { SelectedFile } from '../../types';

interface DropZoneProps {
  files: SelectedFile[];
  onAddFiles: (files: SelectedFile[]) => void;
  onRemoveFile: (id: string) => void;
  onClearFiles: () => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  files,
  onAddFiles,
  onRemoveFile,
  onClearFiles,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (fileList: FileList) => {
    const newFiles: SelectedFile[] = Array.from(fileList).map((f, i) => ({
      id: `file_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      name: f.name,
      size: f.size,
      type: f.type || 'application/octet-stream',
      fileObj: f,
      lastModified: f.lastModified,
    }));
    onAddFiles(newFiles);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  const getFileIcon = (type: string, name: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-emerald-400" />;
    if (type.startsWith('video/')) return <Film className="w-5 h-5 text-purple-400" />;
    if (type.startsWith('audio/')) return <Music className="w-5 h-5 text-amber-400" />;
    if (name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z') || name.endsWith('.tar'))
      return <Archive className="w-5 h-5 text-yellow-400" />;
    return <FileText className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Hidden File and Folder Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && processFiles(e.target.files)}
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={(e) => e.target.files && processFiles(e.target.files)}
        {...({ webkitdirectory: '', directory: '' } as any)}
        className="hidden"
      />

      {/* Drag & Drop Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-8 flex flex-col items-center justify-center transition-all duration-300 ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-gray-700/70 hover:border-gray-500 bg-gray-900/40'
        }`}
      >
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-3 sm:mb-4 ring-4 sm:ring-8 ring-indigo-500/10">
          <UploadCloud className="w-6 h-6 sm:w-8 sm:h-8 animate-pulse" />
        </div>

        <h3 className="text-base sm:text-lg font-bold text-white mb-1 text-center">
          Drag & Drop Files or Folders Here
        </h3>
        <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6 text-center max-w-md">
          Unlimited file size. Supports single files, multiple selections, or full folders directly over Wi-Fi.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30"
          >
            <FilePlus className="w-4 h-4" />
            <span>Browse Files</span>
          </button>
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium text-xs sm:text-sm border border-gray-700 transition-all"
          >
            <FolderPlus className="w-4 h-4 text-cyan-400" />
            <span>Browse Folder</span>
          </button>
        </div>
      </div>

      {/* Selected File Queue */}
      {files.length > 0 && (
        <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-800 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <span className="text-sm font-bold text-gray-200 flex items-center space-x-2">
              <span>Selected Queue</span>
              <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full">
                {files.length} {files.length === 1 ? 'file' : 'files'}
              </span>
            </span>

            <button
              onClick={onClearFiles}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-800/60 border border-gray-700/50 hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0 pr-4">
                  <div className="p-2 rounded-lg bg-gray-900/60">
                    {getFileIcon(file.type, file.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-200 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveFile(file.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
