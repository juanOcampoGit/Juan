import React, { useState } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { UploadCloud, FileStack, ArrowRight, CheckCircle2, AlertCircle, Loader2, Download, GripVertical } from 'lucide-react';
import { SortableFileItem } from './components/SortableFileItem';
import { UploadedFile, ProcessingStatus } from './types';
import { generateMergedPdf, downloadPdf } from './services/pdfService';

const App: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>({ 
    isProcessing: false, 
    message: '' 
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      // Cast to File[] because Array.from on FileList can return unknown[] in some TS configs
      const fileList = Array.from(event.target.files) as File[];
      const newFiles: UploadedFile[] = fileList.map((file) => ({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        type: file.type,
        size: file.size,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
    // Reset input
    event.target.value = '';
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleMerge = async () => {
    if (files.length === 0) return;

    setStatus({ isProcessing: true, message: 'Procesando documentos e imágenes...' });

    try {
      // Small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const pdfBytes = await generateMergedPdf(files);
      
      setStatus({ isProcessing: true, message: 'Finalizando archivo...' });
      
      downloadPdf(pdfBytes, `fusion_documento_${new Date().getTime()}.pdf`);
      
      setStatus({ isProcessing: false, message: '¡Listo! Tu PDF se ha descargado.' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setStatus({ isProcessing: false, message: '' }), 5000);

    } catch (error) {
      console.error(error);
      setStatus({ 
        isProcessing: false, 
        message: '', 
        error: 'Hubo un error al crear el PDF. Asegúrate de que los archivos no estén dañados.' 
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <FileStack size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              PDF Fusion
            </h1>
          </div>
          <div className="text-sm font-medium text-slate-500">
            Organizador Inteligente
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Intro / Empty State */}
        <div className="mb-8 text-center space-y-2">
          <h2 className="text-3xl font-bold text-slate-900">Combina PDFs e Imágenes</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Sube tus archivos, arrástralos para ordenarlos y descarga un único PDF listo para usar. 
            Las imágenes se ajustarán automáticamente al tamaño de página A4.
          </p>
        </div>

        {/* Upload Area */}
        <div className="mb-8">
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-white hover:bg-slate-50 hover:border-indigo-400 transition-all group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud size={32} />
              </div>
              <p className="mb-1 text-sm text-slate-700 font-medium">
                <span className="font-bold text-indigo-600">Haz clic para subir</span> o arrastra y suelta
              </p>
              <p className="text-xs text-slate-500">PDF, JPG, PNG (Max 50MB)</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              multiple 
              accept=".pdf, .jpg, .jpeg, .png" 
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* File List & Sorting */}
        {files.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-xs text-slate-700">
                  {files.length}
                </span>
                Archivos seleccionados
              </h3>
              <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">
                Arrastra para ordenar
              </span>
            </div>

            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={files.map(f => f.id)} 
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {files.map((file, index) => (
                    <SortableFileItem 
                      key={file.id} 
                      file={file} 
                      index={index} 
                      onRemove={removeFile}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {/* Empty State Helper */}
        {files.length === 0 && (
          <div className="flex flex-col sm:flex-row gap-6 justify-center mt-12 opacity-60">
            <div className="flex flex-col items-center text-center max-w-[200px]">
              <div className="bg-slate-200 rounded-lg p-3 mb-3"><UploadCloud className="text-slate-500" /></div>
              <span className="text-sm font-medium">1. Sube archivos</span>
            </div>
            <div className="hidden sm:flex items-center text-slate-300"><ArrowRight /></div>
            <div className="flex flex-col items-center text-center max-w-[200px]">
              <div className="bg-slate-200 rounded-lg p-3 mb-3"><GripVertical className="text-slate-500" /></div>
              <span className="text-sm font-medium">2. Ordena la lista</span>
            </div>
            <div className="hidden sm:flex items-center text-slate-300"><ArrowRight /></div>
            <div className="flex flex-col items-center text-center max-w-[200px]">
              <div className="bg-slate-200 rounded-lg p-3 mb-3"><Download className="text-slate-500" /></div>
              <span className="text-sm font-medium">3. Descarga PDF</span>
            </div>
          </div>
        )}

      </main>

      {/* Floating Bottom Action Bar */}
      {files.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="hidden sm:block">
              {status.error ? (
                 <div className="flex items-center text-red-600 text-sm font-medium">
                   <AlertCircle size={18} className="mr-2" />
                   {status.error}
                 </div>
              ) : (
                <div className="text-sm text-slate-500">
                  Total: {files.length} documento{files.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            <button
              onClick={handleMerge}
              disabled={status.isProcessing}
              className={`
                flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all
                ${status.isProcessing 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0'
                }
                w-full sm:w-auto
              `}
            >
              {status.isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {status.message || 'Procesando...'}
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  Fusionar y Descargar PDF
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;