import React, { useState, useEffect } from 'react';
import { X, Save, User, FileText, Phone, MapPin, Calendar } from 'lucide-react';
import { Client } from '../types';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (client: Omit<Client, 'id' | 'companyId' | 'createdAt'>) => void;
    clientToEdit?: Client | null;
    initialName?: string;
}

export const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSave, clientToEdit, initialName = '' }) => {
    const [formData, setFormData] = useState({
        name: '',
        cpfCnpj: '',
        phone: '',
        address: '',
        birthDate: ''
    });

    useEffect(() => {
        if (clientToEdit) {
            setFormData({
                name: clientToEdit.name,
                cpfCnpj: clientToEdit.cpfCnpj || '',
                phone: clientToEdit.phone || '',
                address: clientToEdit.address || '',
                birthDate: clientToEdit.birthDate || ''
            });
        } else {
            setFormData({ name: initialName, cpfCnpj: '', phone: '', address: '', birthDate: '' });
        }
    }, [clientToEdit, isOpen, initialName]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-dark-800 rounded-2xl w-full max-w-lg border border-dark-600 shadow-2xl animate-enter">
                <div className="flex justify-between items-center p-6 border-b border-dark-700">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="text-gold-500" size={24} />
                        {clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Nome */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo *</label>
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-dark-900 border border-dark-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 outline-none transition-all placeholder-gray-600"
                                placeholder="Ex: João da Silva"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* CPF/CNPJ */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">CPF / CNPJ</label>
                            <div className="relative">
                                <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    value={formData.cpfCnpj}
                                    onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                                    className="w-full bg-dark-900 border border-dark-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-gold-500/50 outline-none"
                                    placeholder="000.000.000-00"
                                />
                            </div>
                        </div>

                        {/* Telefone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Telefone</label>
                            <div className="relative">
                                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-dark-900 border border-dark-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-gold-500/50 outline-none"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Data Nascimento */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Data Nascimento</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="date"
                                    value={formData.birthDate}
                                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                    className="w-full bg-dark-900 border border-dark-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-gold-500/50 outline-none items-center"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Endereço */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Endereço</label>
                        <div className="relative">
                            <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full bg-dark-900 border border-dark-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-gold-500/50 outline-none"
                                placeholder="Rua, Número, Bairro, Cidade - UF"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-gradient-to-r from-gold-500 to-amber-500 text-dark-900 font-bold rounded-lg hover:shadow-glow-gold hover:scale-105 transition-all flex items-center gap-2"
                        >
                            <Save size={18} />
                            Salvar Cliente
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
