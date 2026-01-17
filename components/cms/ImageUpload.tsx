import React, { useState, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';

interface ImageUploadProps {
    currentImageUrl?: string;
    onImageUploaded: (url: string) => void;
    bucket?: string;
    folder?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
    currentImageUrl,
    onImageUploaded,
    bucket = 'article-images',
    folder = 'articles'
}) => {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
        if (!file) return;

        // Validar tipo de archivo
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            toast.error('Tipo de archivo no válido', {
                description: 'Solo se permiten: JPG, PNG, WebP, GIF'
            });
            return;
        }

        // Validar tamaño (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Archivo demasiado grande', {
                description: 'El tamaño máximo es 5MB'
            });
            return;
        }

        setUploading(true);

        try {
            // Crear nombre único para el archivo
            const fileExt = file.name.split('.').pop();
            const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

            // Subir a Supabase Storage
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(data.path);

            setPreviewUrl(publicUrl);
            onImageUploaded(publicUrl);

            toast.success('Imagen subida correctamente');

        } catch (error: any) {
            console.error('Error uploading image:', error);
            toast.error('Error al subir imagen', {
                description: error.message || 'Intenta de nuevo'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleRemove = () => {
        setPreviewUrl(null);
        onImageUploaded('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-3">
            <label className="block text-slate-400 mb-2">Imagen del Artículo</label>

            {previewUrl ? (
                // Vista previa de la imagen
                <div className="relative group">
                    <img
                        src={previewUrl}
                        alt="Vista previa"
                        className="w-full h-48 object-cover rounded-lg border border-slate-700"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-4">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-sm transition-colors"
                        >
                            Cambiar
                        </button>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-sm transition-colors"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            ) : (
                // Zona de carga
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                        ${dragActive
                            ? 'border-sky-500 bg-sky-500/10'
                            : 'border-slate-700 hover:border-slate-600 bg-slate-900/50 hover:bg-slate-800/50'
                        }
                        ${uploading ? 'pointer-events-none opacity-50' : ''}
                    `}
                >
                    {uploading ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-400 font-medium">Subiendo imagen...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-white font-bold">
                                    Arrastra una imagen aquí
                                </p>
                                <p className="text-slate-500 text-sm mt-1">
                                    o haz clic para seleccionar
                                </p>
                            </div>
                            <p className="text-slate-600 text-xs mt-2">
                                JPG, PNG, WebP o GIF • Máximo 5MB
                            </p>
                        </div>
                    )}
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleChange}
                className="hidden"
                title="Seleccionar imagen"
            />
        </div>
    );
};

export default ImageUpload;
