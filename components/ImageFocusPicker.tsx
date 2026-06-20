import React, { useRef, useState } from 'react';

interface ImageFocusPickerProps {
    imageUrl: string;
    /** object-position CSS, ej: "50% 50%". */
    value: string;
    onChange: (value: string) => void;
}

const parsePos = (value: string): { x: number; y: number } => {
    const m = value.match(/(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
    if (m) return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
    return { x: 50, y: 50 };
};

/**
 * Selector de punto focal del arte del evento.
 * El usuario arrastra un marcador sobre la imagen completa para elegir qué parte
 * queda centrada cuando se recorta (object-cover). Devuelve un object-position CSS.
 */
const ImageFocusPicker: React.FC<ImageFocusPickerProps> = ({ imageUrl, value, onChange }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState(false);
    const pos = parsePos(value);

    const updateFromEvent = (clientX: number, clientY: number) => {
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        let x = ((clientX - rect.left) / rect.width) * 100;
        let y = ((clientY - rect.top) / rect.height) * 100;
        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));
        onChange(`${Math.round(x)}% ${Math.round(y)}%`);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        setDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        updateFromEvent(e.clientX, e.clientY);
    };
    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragging) return;
        updateFromEvent(e.clientX, e.clientY);
    };
    const handlePointerUp = () => setDragging(false);

    return (
        <div className="space-y-3">
            {/* Imagen completa con marcador arrastrable */}
            <div
                ref={containerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="relative w-full rounded-lg overflow-hidden border border-slate-700 cursor-crosshair select-none bg-slate-900"
                style={{ touchAction: 'none' }}
            >
                <img
                    src={imageUrl}
                    alt="Selecciona el foco del arte"
                    className="w-full max-h-64 object-contain pointer-events-none"
                    draggable={false}
                />
                {/* Marcador del punto focal */}
                <div
                    className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-2 border-white bg-sky-500/40 shadow-lg pointer-events-none flex items-center justify-center"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
            </div>

            <p className="text-xs text-slate-400">
                Arrastra el punto para elegir qué parte del arte se muestra en la tarjeta del evento.
            </p>

            {/* Preview del recorte real (banner como se ve en la lista) */}
            <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Vista previa</p>
                <div className="h-28 w-full rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
                    <img
                        src={imageUrl}
                        alt="Vista previa del recorte"
                        className="w-full h-full object-cover"
                        style={{ objectPosition: value }}
                        draggable={false}
                    />
                </div>
            </div>
        </div>
    );
};

export default ImageFocusPicker;
