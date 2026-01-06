import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useGame } from '../context/GameContext';
import { toast } from 'sonner';
import CardSearchInput from './CardSearchInput';
import type { CardSearchResult } from '../utils/ScryfallApi';

interface CreateListingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editListing?: any;
}

interface SelectedCard {
    name: string;
    imageUrl: string;
    quantity: number;
}

const GAMES = [
    'Magic: The Gathering',
    'Pokémon TCG',
    'Yu-Gi-Oh!',
    'One Piece TCG',
    'Lorcana',
    'Star Wars: Unlimited',
    'Flesh and Blood',
    'Digimon Card Game'
];

const FORMATS = [
    'Standard',
    'Modern',
    'Pioneer',
    'Legacy',
    'Vintage',
    'Commander (EDH)',
    'Pauper',
    'Limited',
    'Otro'
];

const CONDITIONS = [
    { value: 'NM', label: 'Near Mint (NM)' },
    { value: 'LP', label: 'Lightly Played (LP)' },
    { value: 'MP', label: 'Moderately Played (MP)' },
    { value: 'HP', label: 'Heavily Played (HP)' },
    { value: 'DMG', label: 'Damaged (DMG)' }
];

const CreateListingModal: React.FC<CreateListingModalProps> = ({ isOpen, onClose, onSuccess, editListing }) => {
    const { currentGame } = useGame();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [title, setTitle] = useState(editListing?.title || '');
    const [description, setDescription] = useState(editListing?.description || '');
    const [listingType, setListingType] = useState<'sale' | 'buy' | 'trade'>(editListing?.listing_type || 'sale');
    const [price, setPrice] = useState(editListing?.price || '');
    // Game locks to current game context
    const [format, setFormat] = useState(editListing?.format || '');
    const [condition, setCondition] = useState(editListing?.condition || '');
    const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([]);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setListingType('sale');
        setPrice('');
        setFormat('');
        setCondition('');
        setSelectedCards([]);
    };

    if (!isOpen) return null;

    const handleCardSelect = (card: CardSearchResult) => {
        // Check if card already exists
        const existingIndex = selectedCards.findIndex(c => c.name === card.name && c.imageUrl === card.imageUrl);

        if (existingIndex >= 0) {
            // Increment quantity
            const updated = [...selectedCards];
            updated[existingIndex].quantity += 1;
            setSelectedCards(updated);
            toast.success(`Cantidad de "${card.name}" aumentada a ${updated[existingIndex].quantity}`);
        } else {
            // Add new card
            setSelectedCards([...selectedCards, {
                name: card.name,
                imageUrl: card.imageUrl,
                quantity: 1
            }]);
            toast.success(`"${card.name}" agregada`);
        }

        // Auto-generate title if empty
        if (!title.trim() && selectedCards.length === 0) {
            setTitle(`${listingType === 'sale' ? 'Vendo' : listingType === 'buy' ? 'Busco' : 'Cambio'} ${card.name}`);
        }
    };

    const removeCard = (index: number) => {
        setSelectedCards(selectedCards.filter((_, i) => i !== index));
    };

    const updateCardQuantity = (index: number, quantity: number) => {
        if (quantity < 1) return;
        const updated = [...selectedCards];
        updated[index].quantity = quantity;
        setSelectedCards(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones
        if (!title.trim()) {
            toast.error('El título es requerido');
            return;
        }

        // Game check implicit via context
        if (listingType !== 'trade' && !price) {
            toast.error('El precio es requerido para ventas y compras');
            return;
        }
        if (selectedCards.length === 0) {
            toast.error('Agrega al menos una carta');
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No autenticado');

            // Calculate total quantity
            const totalQuantity = selectedCards.reduce((sum, card) => sum + card.quantity, 0);

            // Insertar listing
            const { data: listing, error: listingError } = await supabase
                .from('marketplace_listings')
                .insert({
                    seller_id: user.id,
                    title: title.trim(),
                    description: description.trim() || null,
                    listing_type: listingType,
                    price: listingType !== 'trade' ? parseFloat(price) : null,
                    game: currentGame, // For backward compatibility
                    game_type: currentGame, // Use ENUM
                    format: format || null,
                    condition: condition || null,
                    quantity: totalQuantity
                })
                .select()
                .single();

            if (listingError) throw listingError;

            // Insertar imágenes de las cartas seleccionadas
            const imageInserts = selectedCards.map((card, index) => ({
                listing_id: listing.id,
                image_url: card.imageUrl,
                display_order: index
            }));

            const { error: imagesError } = await supabase
                .from('listing_images')
                .insert(imageInserts);

            if (imagesError) console.error('Error inserting images:', imagesError);

            toast.success('Anuncio creado exitosamente');
            onSuccess();
            onClose();
            resetForm();
        } catch (error: any) {
            console.error('Error creating listing:', error);
            toast.error('Error al crear el anuncio: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition text-white placeholder-slate-500";
    const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between z-10">
                    <h2 className="text-2xl font-bold text-white uppercase tracking-tight">
                        {editListing ? 'Editar Anuncio' : 'Nuevo Anuncio'}
                    </h2>
                    <button
                        onClick={onClose}
                        title="Cerrar"
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Tipo de Anuncio */}
                    <div>
                        <label className={labelClass}>Tipo de Anuncio *</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { value: 'sale', label: 'Venta', color: 'red' },
                                { value: 'buy', label: 'Compra', color: 'green' },
                                { value: 'trade', label: 'Cambio', color: 'blue' }
                            ].map(type => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setListingType(type.value as any)}
                                    className={`py-3 px-4 rounded-lg font-bold uppercase tracking-wider transition-all ${listingType === type.value
                                        ? `bg-${type.color}-600 text-white ring-2 ring-${type.color}-400`
                                        : 'bg-slate-900 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Buscar Cartas (Solo para Magic) - Pending support for other APIs */}
                    {currentGame === 'mtg' && (
                        <div>
                            <label className={labelClass}>Buscar Cartas *</label>
                            <CardSearchInput
                                onCardSelect={handleCardSelect}
                                placeholder="Busca cartas por nombre (ej: Force of Will)..."
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                💡 Busca y selecciona las cartas que quieres vender/comprar/cambiar
                            </p>
                        </div>
                    )}

                    {/* Cartas Seleccionadas */}
                    {selectedCards.length > 0 && (
                        <div>
                            <label className={labelClass}>Cartas Seleccionadas ({selectedCards.length})</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                                {selectedCards.map((card, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={card.imageUrl}
                                            alt={card.name}
                                            className="w-full rounded border border-slate-600 group-hover:border-sky-500 transition-colors"
                                        />
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => removeCard(index)}
                                                className="p-1 bg-red-900/90 hover:bg-red-800 text-white rounded-full transition-colors"
                                                title="Eliminar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => updateCardQuantity(index, card.quantity - 1)}
                                                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs"
                                            >
                                                -
                                            </button>
                                            <span className="text-white font-bold text-sm">x{card.quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => updateCardQuantity(index, card.quantity + 1)}
                                                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1 truncate">{card.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Título */}
                    <div>
                        <label htmlFor="listing-title" className={labelClass}>Título del Anuncio *</label>
                        <input
                            id="listing-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={inputClass}
                            placeholder='Ej: "Vendo Force of Will [2XM]"'
                            maxLength={100}
                            required
                        />
                    </div>

                    {/* Descripción */}
                    <div>
                        <label htmlFor="listing-description" className={labelClass}>Descripción</label>
                        <textarea
                            id="listing-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={inputClass}
                            rows={4}
                            placeholder="Detalles adicionales, estado, idioma, etc."
                            maxLength={500}
                        />
                    </div>

                    {/* Juego */}
                    <div>
                        <label htmlFor="listing-game" className={labelClass}>Juego</label>
                        <input
                            id="listing-game"
                            type="text"
                            value={currentGame.toUpperCase()}
                            disabled
                            className={`${inputClass} opacity-60 cursor-not-allowed font-bold`}
                        />
                    </div>

                    {/* Precio, Condición */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {listingType !== 'trade' && (
                            <div>
                                <label htmlFor="listing-price" className={labelClass}>Precio Total (CLP) *</label>
                                <input
                                    id="listing-price"
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className={inputClass}
                                    placeholder="15000"
                                    min="0"
                                    step="100"
                                    required={(listingType as string) !== 'trade'}
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="listing-condition" className={labelClass}>Condición</label>
                            <select
                                id="listing-condition"
                                value={condition}
                                onChange={(e) => setCondition(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Selecciona condición</option>
                                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || selectedCards.length === 0}
                            className="flex-1 py-3 px-6 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                        >
                            {isSubmitting ? 'Creando...' : editListing ? 'Guardar Cambios' : 'Publicar Anuncio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateListingModal;
