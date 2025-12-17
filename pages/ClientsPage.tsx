import React, { useState } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { Plus, Search, Edit2, Trash2, User, Phone, MapPin, Calendar, FileText } from 'lucide-react';
import { ClientModal } from '../components/ClientModal';
import { Client } from '../types';

export const ClientsPage: React.FC = () => {
    const { clients, createClient, updateClient, deleteClient } = useTransactions();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cpfCnpj?.includes(searchTerm) ||
        c.phone?.includes(searchTerm)
    );

    const handleSave = async (clientData: any) => {
        if (clientToEdit) {
            await updateClient(clientToEdit.id, clientData);
        } else {
            await createClient(clientData);
        }
        setIsModalOpen(false);
        setClientToEdit(null);
    };

    const handleEdit = (client: Client) => {
        setClientToEdit(client);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
            await deleteClient(id);
        }
    };

    const handleNew = () => {
        setClientToEdit(null);
        setIsModalOpen(true);
    };

    return (
        <div className="w-full bg-dark-900 min-h-screen text-white p-6 pb-24 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Clientes</h1>
                    <p className="text-gray-400">Gerencie sua base de clientes e fornecedores.</p>
                </div>
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gold-500 to-amber-500 text-dark-900 font-bold rounded-xl hover:shadow-glow-gold hover:scale-105 transition-all"
                >
                    <Plus size={20} />
                    Novo Cliente
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nome, CPF ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-gold-500/50 outline-none transition-all placeholder-gray-600"
                />
            </div>

            {/* Grid List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredClients.length > 0 ? (
                    filteredClients.map(client => (
                        <div key={client.id} className="bg-dark-800 p-5 rounded-xl border border-dark-600 hover:border-gold-500/30 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button onClick={() => handleEdit(client)} className="p-2 bg-dark-700 rounded-lg hover:text-gold-400 transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(client.id)} className="p-2 bg-dark-700 rounded-lg hover:text-red-400 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 rounded-full bg-dark-700 text-gold-500 border border-dark-600">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white leading-tight">{client.name}</h3>
                                    <p className="text-xs text-gray-500 mt-1">Cadastrado em {new Date(client.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-400">
                                {client.cpfCnpj && (
                                    <div className="flex items-center gap-2">
                                        <FileText size={14} className="text-gray-600" />
                                        <span>{client.cpfCnpj}</span>
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-gray-600" />
                                        <span>{client.phone}</span>
                                    </div>
                                )}
                                {client.address && (
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-gray-600" />
                                        <span className="truncate">{client.address}</span>
                                    </div>
                                )}
                                {client.birthDate && (
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-gray-600" />
                                        <span>Nasc: {new Date(client.birthDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center text-gray-500">
                        <User size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Nenhum cliente encontrado.</p>
                    </div>
                )}
            </div>

            <ClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                clientToEdit={clientToEdit}
            />
        </div>
    );
};
