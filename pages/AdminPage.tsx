
import React, { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { Profile } from '../types';
import { CheckCircle, XCircle, Shield, Search } from 'lucide-react';

export const AdminPage: React.FC = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setProfiles(data as Profile[]);
        setLoading(false);
    };

    const toggleApproval = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('profiles')
            .update({ is_approved: !currentStatus })
            .eq('id', id);

        if (!error) {
            setProfiles(prev => prev.map(p =>
                p.id === id ? { ...p, is_approved: !currentStatus } : p
            ));
        }
    };

    const filteredProfiles = profiles.filter(p =>
    (p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Shield className="text-indigo-600" />
                        Administração de Usuários
                    </h1>
                    <p className="text-zinc-500 mt-1">Gerencie o acesso ao sistema</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-zinc-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-6 py-4">Usuário</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Data Cadastro</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-zinc-500">Carregando...</td></tr>
                        ) : filteredProfiles.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-zinc-500">Nenhum usuário encontrado.</td></tr>
                        ) : (
                            filteredProfiles.map(profile => (
                                <tr key={profile.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                                        {profile.full_name || 'Sem nome'}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                        {profile.email}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500">
                                        {new Date(profile.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${profile.is_approved
                                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                                                : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                                            }`}>
                                            {profile.is_approved ? 'Aprovado' : 'Pendente'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => toggleApproval(profile.id, profile.is_approved)}
                                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${profile.is_approved
                                                    ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                                                }`}
                                        >
                                            {profile.is_approved ? (
                                                <>
                                                    <XCircle size={14} /> Revogar
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={14} /> Aprovar
                                                </>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
