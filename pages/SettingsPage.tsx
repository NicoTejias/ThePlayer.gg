import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { sanitizeText, sanitizeUrl } from '../utils/sanitize';
import { z } from 'zod';

const LATAM_COUNTRIES = [
    "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", "Cuba", "Ecuador",
    "El Salvador", "Guatemala", "Haití", "Honduras", "México", "Nicaragua", "Panamá", "Paraguay",
    "Perú", "República Dominicana", "Uruguay", "Venezuela"
];

const OTHER_COUNTRIES = [
    "Estados Unidos", "Canadá", "España", "Alemania", "Francia", "Reino Unido", "Italia", "Japón", "China", "Otro"
];

const ALL_COUNTRIES = [...LATAM_COUNTRIES, ...OTHER_COUNTRIES];

// Simple mapping for demo. In a real app, this would be a full database or external API.
const CITIES_BY_COUNTRY: Record<string, string[]> = {
    "Chile": ["Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta", "Temuco", "Puerto Montt", "Iquique", "Rancagua", "Talca", "Arica", "Chillán", "Los Ángeles", "Calama", "Osorno", "Valdivia"],
    "Argentina": ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "San Miguel de Tucumán", "Mar del Plata", "Salta"],
    "México": ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León", "Ciudad Juárez", "Zapopan"],
    "Perú": ["Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura", "Cusco"],
    "Colombia": ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena"],
    // Fallback for others will be a text input if key doesn't exist or list is empty
};

const CARD_GAMES = [
    "Magic: The Gathering", "Pokémon TCG", "Yu-Gi-Oh!", "One Piece TCG", "Lorcana", "Star Wars: Unlimited", "Flesh and Blood", "Digimon Card Game"
];

const FORMATS = [
    "Standard", "Modern", "Pioneer", "Legacy", "Vintage", "Commander (EDH)", "Pauper", "Sealed", "Draft", "Premodern"
];

const SettingsPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const navigate = useNavigate();

    // Form State
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState(''); // Stores City or Region
    const [role, setRole] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [preferredGames, setPreferredGames] = useState<string[]>([]);
    const [favoriteFormat, setFavoriteFormat] = useState('');
    const [team, setTeam] = useState('');

    // Password State
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    // Alias State
    const [aliases, setAliases] = useState<any[]>([]);
    const [newAlias, setNewAlias] = useState('');
    const [aliasLoading, setAliasLoading] = useState(false);
    const [aliasError, setAliasError] = useState<string | null>(null);

    const fetchAliases = async (userId: string) => {
        const { data, error } = await supabase
            .from('player_aliases')
            .select('*')
            .eq('player_id', userId);

        if (data) setAliases(data);
    };

    const handleAddAlias = async () => {
        const trimmedAlias = newAlias.trim();

        // Validación
        if (!trimmedAlias) return;
        if (trimmedAlias.length < 2) {
            setAliasError('❌ El alias debe tener al menos 2 caracteres.');
            return;
        }
        if (trimmedAlias.length > 100) {
            setAliasError('❌ El alias no puede exceder 100 caracteres.');
            return;
        }

        setAliasLoading(true);
        setAliasError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Sanitizar antes de enviar
            const sanitizedAlias = sanitizeText(trimmedAlias);

            const { error } = await supabase.from('player_aliases').insert({
                player_id: user.id,
                alias_name: sanitizedAlias
            });

            if (error) {
                if (error.code === '23505') {
                    setAliasError('❌ Este alias ya está registrado por otro usuario o por ti mismo.');
                } else {
                    setAliasError(`Error: ${error.message}`);
                }
            } else {
                setNewAlias('');
                setAliasError(null);
                fetchAliases(user.id);
                setMessage({ type: 'success', text: 'Alias agregado correctamente.' });
            }
        } catch (error: any) {
            setAliasError(`Error inesperado: ${error.message}`);
        } finally {
            setAliasLoading(false);
        }
    };

    const handleDeleteAlias = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este alias?')) return;
        try {
            const { error } = await supabase.from('player_aliases').delete().eq('id', id);
            if (error) throw error;
            setAliases(aliases.filter(a => a.id !== id));
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const handlePasswordUpdate = async () => {
        if (!newPassword || newPassword.length < 6) {
            setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
            return;
        }

        setUpdating(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            setMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' });
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Error al actualizar la contraseña.' });
        } finally {
            setUpdating(false);
        }
    };

    useEffect(() => {
        // Force loading to false after 10 seconds just in case
        const timer = setTimeout(() => {
            setLoading((current) => {
                if (current) {
                    console.warn("Forcing loading to false due to timeout");
                    setMessage({ type: 'error', text: 'La carga del perfil tardó demasiado. Por favor recarga la página.' });
                    return false;
                }
                return current;
            });
        }, 10000);

        getProfile();

        return () => clearTimeout(timer);
    }, []);

    const getProfile = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                navigate('/login');
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.warn(error);
            } else if (data) {
                setUsername(data.username || '');
                setFirstName(data.first_name || '');
                setLastName(data.last_name || '');
                setBirthDate(data.birth_date || '');
                setGender(data.gender || '');
                setPhone(data.phone || '');
                setAddress(data.address || '');
                setCountry(data.country || '');
                setCity(data.city || data.region || ''); // Fallback to old 'region' field if city is empty
                setRole(data.role || '');
                setAvatarUrl(data.avatar_url || '');
                setPreferredGames(data.preferred_games || []);
                setFavoriteFormat(data.favorite_format || '');
                setTeam(data.team || '');

                // Fetch aliases once profile is loaded
                fetchAliases(user.id);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setMessage(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('No user logged in');

            const updates = {
                id: user.id,
                username,
                first_name: firstName,
                last_name: lastName,
                birth_date: birthDate || null,
                gender,
                phone,
                address,
                country,
                city, // Mapping to 'city' column, serves as Region/City
                preferred_games: preferredGames,
                favorite_format: favoriteFormat,
                team,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
            window.scrollTo(0, 0);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
            window.scrollTo(0, 0);
        } finally {
            setUpdating(false);
        }
    };

    const handleGameToggle = (game: string) => {
        if (preferredGames.includes(game)) {
            setPreferredGames(preferredGames.filter(g => g !== game));
        } else {
            setPreferredGames([...preferredGames, game]);
        }
    };

    const commonInputClass = "w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition duration-200 text-white placeholder-slate-500";
    const labelClass = "block text-sm font-medium text-slate-400 mb-1";

    if (loading) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Cargando perfil...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white py-12 px-4">
            <div className="max-w-4xl mx-auto bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-700">
                <h1 className="text-3xl font-bold mb-8 text-center uppercase tracking-wide text-sky-400">Configuración de Perfil</h1>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg text-center ${message.type === 'success' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/50' : 'bg-red-900/50 text-red-400 border border-red-500/50'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-8">

                    {/* Sección 1: Información Básica */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2">Información Personal</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="firstName" className={labelClass}>Nombre(s)</label>
                                <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={commonInputClass} />
                            </div>
                            <div>
                                <label htmlFor="lastName" className={labelClass}>Apellido(s)</label>
                                <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={commonInputClass} />
                            </div>
                            <div>
                                <label htmlFor="username" className={labelClass}>Nombre de Usuario (Nick)</label>
                                <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={commonInputClass} />
                            </div>
                            <div>
                                <label htmlFor="birthDate" className={labelClass}>Fecha de Nacimiento</label>
                                <input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={commonInputClass} />
                            </div>
                            <div>
                                <label htmlFor="gender" className={labelClass}>Género</label>
                                <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} className={commonInputClass}>
                                    <option value="">Seleccionar</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                    <option value="Otro">Otro</option>
                                    <option value="Prefiero no decir">Prefiero no decir</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="phone" className={labelClass}>Teléfono</label>
                                <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={commonInputClass} placeholder="+56 9 ..." />
                            </div>
                        </div>
                    </section>

                    {/* Sección 2: Ubicación */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2">Ubicación</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label htmlFor="address" className={labelClass}>Dirección</label>
                                <input id="address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={commonInputClass} placeholder="Calle, Número, Depto..." />
                            </div>
                            <div>
                                <label htmlFor="country" className={labelClass}>País</label>
                                <select id="country" value={country} onChange={(e) => { setCountry(e.target.value); setCity(''); }} className={commonInputClass}>
                                    <option value="">Selecciona tu país</option>
                                    <optgroup label="Latinoamérica">
                                        {LATAM_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </optgroup>
                                    <optgroup label="Resto del Mundo">
                                        {OTHER_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </optgroup>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="city" className={labelClass}>Región / Ciudad</label>
                                {country && CITIES_BY_COUNTRY[country] ? (
                                    <select id="city" value={city} onChange={(e) => setCity(e.target.value)} className={commonInputClass}>
                                        <option value="">Selecciona tu ciudad/región</option>
                                        {CITIES_BY_COUNTRY[country].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                ) : (
                                    <input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} className={commonInputClass} placeholder="Escribe tu ciudad o región" />
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Sección 3: Preferencias de Juego */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2">Perfil de Jugador</h2>
                        <div className="space-y-6">
                            <div>
                                <label className={labelClass}>Juegos que juegas (Selecciona uno o más)</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                                    {CARD_GAMES.map(game => (
                                        <div
                                            key={game}
                                            onClick={() => handleGameToggle(game)}
                                            className={`cursor-pointer border rounded-lg p-3 text-sm text-center transition-all duration-200 flex items-center justify-center h-full
                                                ${preferredGames.includes(game)
                                                    ? 'bg-sky-600 border-sky-500 text-white font-bold ring-2 ring-sky-300 ring-opacity-50'
                                                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                                                }`}
                                        >
                                            {game}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="favoriteFormat" className={labelClass}>Formato Favorito</label>
                                    <select id="favoriteFormat" value={favoriteFormat} onChange={(e) => setFavoriteFormat(e.target.value)} className={commonInputClass}>
                                        <option value="">Selecciona un formato</option>
                                        {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Team / Equipo</label>
                                    <input type="text" value={team} onChange={(e) => setTeam(e.target.value)} className={commonInputClass} placeholder="Nombre de tu equipo" />
                                </div>
                            </div>
                        </div>
                    </section>


                    {/* Sección 4: Alias de Competencia */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2">Nombres de Competencia (Alias)</h2>
                        <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 space-y-4">
                            <p className="text-sm text-slate-400">
                                Agrega aquí los nombres exactos que usas en las apps de torneos (Companion, Melee, etc.).
                                Esto nos permite sumar tus puntos automáticamente aunque el organizador escriba tu nombre de forma distinta.
                            </p>

                            <div className="flex flex-col md:flex-row gap-3 items-end">
                                <div className="flex-grow w-full">
                                    <label className={labelClass}>Nuevo Alias / Nombre en App</label>
                                    <input
                                        type="text"
                                        value={newAlias}
                                        onChange={(e) => { setNewAlias(e.target.value); setAliasError(null); }}
                                        className={`${commonInputClass} ${aliasError ? 'border-red-500 ring-2 ring-red-500/50' : ''}`}
                                        placeholder='Ej: "Juan Perez", "Juan P.", "DarkMage99"'
                                    />
                                    {aliasError && (
                                        <p className="text-sm text-red-400 mt-2 bg-red-900/30 p-2 rounded border border-red-500/50 animate-pulse">
                                            {aliasError}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddAlias}
                                    disabled={!newAlias.trim() || aliasLoading}
                                    className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {aliasLoading ? '...' : 'Agregar Alias'}
                                </button>
                            </div>

                            {/* Alias List */}
                            <div className="mt-4">
                                <h4 className="text-sm font-semibold text-white mb-2">Tus Alias Registrados:</h4>
                                {aliases.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {aliases.map((alias) => (
                                            <div key={alias.id} className="group relative flex items-center gap-2 bg-slate-800 text-indigo-300 px-3 py-1.5 rounded-full border border-indigo-900/50 pr-8">
                                                <span className="text-sm font-medium">{alias.alias_name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteAlias(alias.id)}
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-red-400 rounded-full transition-colors"
                                                    title="Eliminar alias"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 italic">No tienes alias registrados. Agrega uno arriba.</p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Sección 5: Cuenta */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2">Cuenta</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Rol de Cuenta</label>
                                <div className="px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-500 capitalize cursor-not-allowed">
                                    {role === 'store' ? 'Organizador / Tienda' : 'Jugador'}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">El rol no se puede cambiar aquí.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Avatar URL</label>
                                <input
                                    type="text"
                                    value={avatarUrl}
                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                    className={commonInputClass}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                        {/* Placeholder for Password Change - Functional logic would require more complex auth flow */}
                        <div className="mt-8 pt-6 border-t border-slate-700">
                            <h3 className="text-lg font-bold text-white mb-4">Seguridad</h3>
                            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                                <h4 className="text-sm font-semibold text-sky-400 mb-4 uppercase tracking-wider">Cambiar Contraseña</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                    <div>
                                        <label className={labelClass}>Nueva Contraseña</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className={commonInputClass}
                                            placeholder="Mínimo 6 caracteres"
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Confirmar Nueva Contraseña</label>
                                        <input
                                            type="password"
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            className={commonInputClass}
                                            placeholder="Repite la contraseña"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handlePasswordUpdate}
                                    disabled={!newPassword || updating}
                                    className="px-6 py-2 bg-slate-700 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    Actualizar Contraseña
                                </button>
                                <p className="text-xs text-slate-500 mt-3">
                                    Nota: Si iniciaste sesión con Google, no necesitas establecer una contraseña aquí, pero puedes hacerlo si deseas habilitar el inicio de sesión con correo.
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="pt-8">
                        <button
                            type="submit"
                            disabled={updating}
                            className="w-full py-4 px-6 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-lg rounded-xl shadow-lg transform transition hover:scale-[1.01] duration-200 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider"
                        >
                            {updating ? 'Guardando Perfil...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsPage;
