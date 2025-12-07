import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, Image as ImageIcon, Trash2, GripVertical } from 'lucide-react';
import { UploadedFile, FileType } from '../types';

interface SortableFileItemProps {
  file: UploadedFile;
  index: number;
  onRemove: (id: string) => void;
}

export const SortableFileItem: React.FC<SortableFileItemProps> = ({ file, index, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const isPdf = file.type === FileType.PDF;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative flex items-center gap-4 p-4 mb-3 bg-white rounded-xl border border-slate-200 shadow-sm 
        hover:border-indigo-300 hover:shadow-md transition-all duration-200
        ${isDragging ? 'shadow-xl ring-2 ring-indigo-500 bg-indigo-50' : ''}
      `}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-indigo-600 p-1"
      >
        <GripVertical size={20} />
      </div>

      {/* Order Badge */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
        {index + 1}
      </div>

      {/* Icon / Thumbnail */}
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
        {isPdf ? (
          <FileText className="text-red-500" size={24} />
        ) : (
          file.previewUrl ? (
            <img src={file.previewUrl} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="text-blue-500" size={24} />
          )
        )}
      </div>

      {/* File Info */}
      <div className="flex-grow min-w-0">
        <h4 className="text-sm font-medium text-slate-900 truncate" title={file.name}>
          {file.name}
        </h4>
        <p className="text-xs text-slate-500">
          {(file.size / 1024 / 1024).toFixed(2)} MB • {isPdf ? 'Documento PDF' : 'Imagen'}
        </p>
      </div>

      {/* Actions */}
      <button
        onClick={() => onRemove(file.id)}
        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        title="Eliminar archivo"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};
