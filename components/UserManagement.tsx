import React, { useState } from 'react';
import { Users, Plus, X, Edit2, Trash2, Shield, Mail, Calendar as CalendarIcon, CheckCircle2, XCircle } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import { User, UserRole, Permission, PermissionModule } from '../types';

const defaultPermissions: Permission[] = [
    { module: 'transactions', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'reports', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'settings', canView: false, canCreate: false, canEdit: false, canDelete: false },
    { module: 'bank-reconciliation', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'purchases', canView: true, canCreate: true, canEdit: true, canDelete: true },
    { module: 'planning', canView: true, canCreate: true, canEdit: true, canDelete: false },
    { module: 'cashflow', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { module: 'simulations', canView: true, canCreate: false, canEdit: false, canDelete: false },
];

const getRolePermissions = (role: UserRole): Permission[] => { // ... unchanged 
    switch (role) {
        case 'admin':
            return defaultPermissions.map(p => ({ ...p, canView: true, canCreate: true, canEdit: true, canDelete: true }));
        case 'manager':
            return defaultPermissions.map(p => ({ ...p, canView: true, canCreate: true, canEdit: true, canDelete: p.module !== 'settings' }));
        case 'user':
            return defaultPermissions.map(p => ({ ...p, canView: true, canCreate: p.module === 'transactions' || p.module === 'purchases', canEdit: p.module === 'transactions', canDelete: false }));
        case 'viewer':
            return defaultPermissions.map(p => ({ ...p, canView: true, canCreate: false, canEdit: false, canDelete: false }));
        default:
            return defaultPermissions;
    }
};

const moduleNames: Record<PermissionModule, string> = {
    transactions: 'Transações',
    reports: 'Relatórios',
    settings: 'Configurações',
    'bank-reconciliation': 'Conciliação Bancária',
    purchases: 'Compras',
    planning: 'Planejamento',
    cashflow: 'Fluxo de Caixa',
    simulations: 'Simulações',
};

export const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<Partial<User>>({
        name: '',
        email: '',
        role: 'user',
        permissions: getRolePermissions('user'),
        active: true,
    });

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; userId: string | null; userName: string }>({
        isOpen: false,
        userId: null,
        userName: ''
    });

    const handleOpenAdd = () => {
        setEditingUser(null);
        setFormData({
            name: '',
            email: '',
            role: 'user',
            permissions: getRolePermissions('user'),
            active: true,
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user: User) => {
        setEditingUser(user);
        setFormData({ ...user });
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formData.name || !formData.email) {
            alert('Preencha nome e email');
            return;
        }

        if (editingUser) {
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } as User : u));
        } else {
            const newUser: User = {
                id: `user-${Date.now()}`,
                name: formData.name!,
                email: formData.email!,
                role: formData.role!,
                permissions: formData.permissions!,
                createdAt: new Date().toISOString().split('T')[0],
                active: formData.active!,
            };
            setUsers([...users, newUser]);
        }
        setIsModalOpen(false);
    };

    const handleDeleteCheck = (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            setDeleteModal({ isOpen: true, userId, userName: user.name });
        }
    };

    const handleConfirmDelete = () => {
        if (deleteModal.userId) {
            setUsers(users.filter(u => u.id !== deleteModal.userId));
            setDeleteModal({ isOpen: false, userId: null, userName: '' });
        }
    };

    const handleRoleChange = (role: UserRole) => {
        setFormData({ ...formData, role, permissions: getRolePermissions(role) });
    };

    const handlePermissionChange = (moduleIndex: number, field: keyof Permission) => {
        if (!formData.permissions) return;
        const newPermissions = [...formData.permissions];
        if (field !== 'module') {
            newPermissions[moduleIndex] = {
                ...newPermissions[moduleIndex],
                [field]: !newPermissions[moduleIndex][field],
            };
            setFormData({ ...formData, permissions: newPermissions });
        }
    };

    const getRoleBadge = (role: UserRole) => {
        const badges = {
            admin: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
            manager: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
            user: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400',
            viewer: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-400',
        };
        const labels = {
            admin: 'Administrador',
            manager: 'Gerente',
            user: 'Usuário',
            viewer: 'Visualizador',
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-bold ${badges[role]}`}>{labels[role]}</span>;
    };

    return (
        <>
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col min-h-[600px]">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <Users size={20} />
                            Gestão de Usuários
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Gerencie usuários e suas permissões no sistema.</p>
                    </div>
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-400 text-black px-3 py-1.5 rounded-lg text-sm font-bold transition"
                    >
                        <Plus size={16} />
                        <span>Adicionar Usuário</span>
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {users.map(user => (
                        <div
                            key={user.id}
                            className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center text-sm font-bold text-black shadow-md">
                                        {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-zinc-900 dark:text-white">{user.name}</h4>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                            <Mail size={10} />
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {user.active ? (
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                    ) : (
                                        <XCircle size={16} className="text-rose-500" />
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                                {getRoleBadge(user.role)}
                                {user.lastLogin && (
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                        <CalendarIcon size={10} />
                                        {new Date(user.lastLogin).toLocaleDateString('pt-BR')}
                                    </span>
                                )}
                            </div>

                            <div className="flex space-x-2 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                                <button
                                    onClick={() => handleOpenEdit(user)}
                                    className="flex-1 flex items-center justify-center gap-1 p-2 text-zinc-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded transition-colors text-sm"
                                >
                                    <Edit2 size={14} />
                                    Editar
                                </button>
                                {user.id !== '1' && (
                                    <button
                                        onClick={() => handleDeleteCheck(user.id)}
                                        className="flex-1 flex items-center justify-center gap-1 p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-colors text-sm"
                                    >
                                        <Trash2 size={14} />
                                        Remover
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={handleConfirmDelete}
                title="Remover Usuário"
                message={`Tem certeza que deseja remover o usuário "${deleteModal.userName}"? Esta ação não pode ser desfeita.`}
            />

            {/* User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-3xl border border-zinc-200 dark:border-zinc-800 max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Shield size={20} />
                                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                                        placeholder="Ex: João Silva"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                                        placeholder="usuario@empresa.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Nível de Acesso</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['admin', 'manager', 'user', 'viewer'] as UserRole[]).map(role => (
                                        <button
                                            key={role}
                                            onClick={() => handleRoleChange(role)}
                                            className={`p-3 rounded-lg border-2 transition-all ${formData.role === role
                                                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                                                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                                                }`}
                                        >
                                            {getRoleBadge(role)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Permissões por Módulo</label>
                                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-zinc-100 dark:bg-zinc-800">
                                            <tr>
                                                <th className="text-left px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300">Módulo</th>
                                                <th className="text-center px-2 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300">Ver</th>
                                                <th className="text-center px-2 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300">Criar</th>
                                                <th className="text-center px-2 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300">Editar</th>
                                                <th className="text-center px-2 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300">Excluir</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                                            {formData.permissions?.map((perm, idx) => (
                                                <tr key={perm.module} className="hover:bg-zinc-100 dark:hover:bg-zinc-800/50">
                                                    <td className="px-4 py-2 text-zinc-900 dark:text-zinc-100 font-medium">{moduleNames[perm.module]}</td>
                                                    <td className="px-2 py-2 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={perm.canView}
                                                            onChange={() => handlePermissionChange(idx, 'canView')}
                                                            className="w-4 h-4 text-yellow-500 rounded focus:ring-yellow-500"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={perm.canCreate}
                                                            onChange={() => handlePermissionChange(idx, 'canCreate')}
                                                            className="w-4 h-4 text-yellow-500 rounded focus:ring-yellow-500"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={perm.canEdit}
                                                            onChange={() => handlePermissionChange(idx, 'canEdit')}
                                                            className="w-4 h-4 text-yellow-500 rounded focus:ring-yellow-500"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={perm.canDelete}
                                                            onChange={() => handlePermissionChange(idx, 'canDelete')}
                                                            className="w-4 h-4 text-yellow-500 rounded focus:ring-yellow-500"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                    className="w-4 h-4 text-yellow-500 rounded focus:ring-yellow-500"
                                />
                                <label className="text-sm text-zinc-700 dark:text-zinc-300">Usuário ativo</label>
                            </div>
                        </div>

                        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end space-x-2">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!formData.name || !formData.email}
                                className="px-4 py-2 text-sm font-bold text-black bg-yellow-500 hover:bg-yellow-400 rounded-lg disabled:opacity-50 transition"
                            >
                                {editingUser ? 'Atualizar' : 'Criar'} Usuário
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
