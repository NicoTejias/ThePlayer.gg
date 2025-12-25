import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

interface RatingModalProps {
    sellerId: string;
    listingId: string;
    listingTitle: string;
    onClose: () => void;
    onRatingSubmitted: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({
    sellerId,
    listingId,
    listingTitle,
    onClose,
    onRatingSubmitted
}) => {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Por favor selecciona una calificación');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase.rpc('create_seller_rating', {
                p_seller_id: sellerId,
                p_listing_id: listingId,
                p_rating: rating,
                p_comment: comment.trim() || null
            });

            if (error) throw error;

            toast.success('¡Gracias por tu calificación! ⭐');
            onRatingSubmitted();
            onClose();
        } catch (error: any) {
            console.error('Error submitting rating:', error);
            toast.error('Error: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Calificar Vendedor</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Listing Info */}
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6">
                    <p className="text-slate-400 text-sm mb-1">Producto:</p>
                    <p className="text-white font-medium">{listingTitle}</p>
                </div>

                {/* Star Rating */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                        Tu Calificación *
                    </label>
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                className="transition-transform hover:scale-110"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-10 w-10"
                                    fill={(hoveredRating || rating) >= star ? 'currentColor' : 'none'}
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    style={{
                                        color: (hoveredRating || rating) >= star ? '#fbbf24' : '#64748b'
                                    }}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                    />
                                </svg>
                            </button>
                        ))}
                        {rating > 0 && (
                            <span className="ml-2 text-slate-400 text-sm">
                                {rating} {rating === 1 ? 'estrella' : 'estrellas'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Comment */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Comentario (Opcional)
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        maxLength={500}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                        placeholder="Comparte tu experiencia con este vendedor..."
                    />
                    <p className="text-slate-500 text-xs mt-1">
                        {comment.length}/500 caracteres
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || rating === 0}
                        className="flex-1 py-2 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {submitting ? 'Enviando...' : 'Enviar Calificación'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RatingModal;
