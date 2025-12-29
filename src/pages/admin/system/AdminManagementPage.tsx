import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Users,
    Plus,
    Edit,
    Trash2,
    Shield,
    ShieldCheck,
    ShieldAlert,
    Loader2,
    Mail,
    User,
    Check,
    X,
    RefreshCw
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { Modal } from '../../../components/ui/Modal';
import type { AdminUser, AdminRole } from '../../../types';

const adminSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    full_name: z.string().min(2, 'Full name is required'),
    role: z.enum(['super_admin', 'admin', 'analyst']),
});

type AdminFormData = z.infer<typeof adminSchema>;

export function AdminManagementPage() {
    const { adminProfile, isSuperAdmin } = useAdminAuth();
    const [loading, setLoading] = useState(true);
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AdminFormData>({
        resolver: zodResolver(adminSchema),
        defaultValues: { role: 'analyst' }
    });

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('admin_users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAdmins(data || []);
        } catch (error) {
            console.error('Error fetching admins:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (admin?: AdminUser) => {
        if (admin) {
            setEditingAdmin(admin);
            setValue('email', admin.email);
            setValue('full_name', admin.full_name);
            setValue('role', admin.role);
        } else {
            setEditingAdmin(null);
            reset({ email: '', full_name: '', role: 'analyst' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingAdmin(null);
        reset();
    };

    const onSubmit = async (data: AdminFormData) => {
        setSubmitting(true);
        try {
            if (editingAdmin) {
                // Update existing admin
                const { error } = await supabase
                    .from('admin_users')
                    .update({
                        full_name: data.full_name,
                        role: data.role,
                    })
                    .eq('id', editingAdmin.id);

                if (error) throw error;
            } else {
                // For new admin, we need to check if user exists in auth.users
                // If not, we'll need to invite them
                const { data: existingUser } = await supabase
                    .from('admin_users')
                    .select('id')
                    .eq('email', data.email)
                    .maybeSingle();

                if (existingUser) {
                    throw new Error('An admin with this email already exists');
                }

                // Check if user exists in auth.users
                // Note: This requires the user to sign up first
                // For now, we'll add a placeholder that gets activated when they sign up
                // This is a simplified approach - in production, you might want to send an invite

                // Insert admin record - it will be linked to user_id when they sign up
                const { error } = await supabase
                    .from('admin_users')
                    .insert({
                        email: data.email,
                        full_name: data.full_name,
                        role: data.role,
                        user_id: '00000000-0000-0000-0000-000000000000', // Placeholder
                        is_active: false, // Will be activated when they sign up
                    });

                if (error) throw error;
            }

            await fetchAdmins();
            closeModal();
        } catch (error: any) {
            alert(error.message || 'Failed to save admin');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleAdminStatus = async (admin: AdminUser) => {
        if (admin.id === adminProfile?.id) {
            alert('You cannot deactivate your own account');
            return;
        }

        try {
            const { error } = await supabase
                .from('admin_users')
                .update({ is_active: !admin.is_active })
                .eq('id', admin.id);

            if (error) throw error;
            await fetchAdmins();
        } catch (error) {
            console.error('Error toggling admin status:', error);
        }
    };

    const deleteAdmin = async (admin: AdminUser) => {
        if (admin.id === adminProfile?.id) {
            alert('You cannot delete your own account');
            return;
        }

        if (!confirm(`Are you sure you want to delete ${admin.full_name}?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('admin_users')
                .delete()
                .eq('id', admin.id);

            if (error) throw error;
            await fetchAdmins();
        } catch (error) {
            console.error('Error deleting admin:', error);
        }
    };

    const getRoleIcon = (role: AdminRole) => {
        switch (role) {
            case 'super_admin':
                return <ShieldCheck className="w-5 h-5 text-amber-400" />;
            case 'admin':
                return <Shield className="w-5 h-5 text-violet-400" />;
            default:
                return <ShieldAlert className="w-5 h-5 text-slate-400" />;
        }
    };

    const getRoleBadge = (role: AdminRole) => {
        const styles = {
            super_admin: 'bg-gradient-to-r from-amber-500 to-orange-500',
            admin: 'bg-gradient-to-r from-violet-500 to-purple-600',
            analyst: 'bg-gradient-to-r from-slate-500 to-slate-600',
        };
        const labels = {
            super_admin: 'Super Admin',
            admin: 'Admin',
            analyst: 'Analyst',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${styles[role]}`}>
                {labels[role]}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
                    <p className="text-violet-300">Loading admin users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-violet-400" />
                        Admin Management
                    </h1>
                    <p className="text-violet-300 mt-1">{admins.length} admin users</p>
                </div>
                <div className="flex gap-2">
                    {isSuperAdmin && (
                        <button
                            onClick={() => openModal()}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium transition-all hover:scale-105"
                            style={{
                                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
                            }}
                        >
                            <Plus className="w-4 h-4" />
                            Add Admin
                        </button>
                    )}
                    <button
                        onClick={fetchAdmins}
                        className="p-2 rounded-xl text-violet-300 hover:bg-violet-500/20 transition-all"
                        style={{ border: '1px solid rgba(139, 92, 246, 0.3)' }}
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Role Legend */}
            <div className="flex flex-wrap gap-4 p-4 rounded-xl" style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    <span className="text-violet-300 text-sm">Super Admin - Full platform control</span>
                </div>
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-violet-400" />
                    <span className="text-violet-300 text-sm">Admin - Manage businesses & announcements</span>
                </div>
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-slate-400" />
                    <span className="text-violet-300 text-sm">Analyst - View-only access</span>
                </div>
            </div>

            {/* Admin Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {admins.map((admin) => (
                    <div
                        key={admin.id}
                        className={`p-6 rounded-2xl transition-all ${!admin.is_active ? 'opacity-60' : ''}`}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(20px)',
                            border: admin.id === adminProfile?.id
                                ? '2px solid rgba(139, 92, 246, 0.5)'
                                : '1px solid rgba(139, 92, 246, 0.2)'
                        }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold" style={{
                                    background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)'
                                }}>
                                    {admin.full_name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold flex items-center gap-2">
                                        {admin.full_name}
                                        {admin.id === adminProfile?.id && (
                                            <span className="text-xs text-violet-400">(You)</span>
                                        )}
                                    </h3>
                                    {getRoleBadge(admin.role)}
                                </div>
                            </div>
                            {getRoleIcon(admin.role)}
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-violet-300">
                                <Mail className="w-4 h-4" />
                                <span className="text-sm truncate">{admin.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-violet-400">
                                <User className="w-4 h-4" />
                                <span className="text-sm">
                                    Joined {new Date(admin.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${admin.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <span className={`text-sm ${admin.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {admin.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>

                        {isSuperAdmin && admin.id !== adminProfile?.id && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openModal(admin)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-violet-300 hover:bg-violet-500/20 transition-all"
                                    style={{ border: '1px solid rgba(139, 92, 246, 0.3)' }}
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => toggleAdminStatus(admin)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all ${admin.is_active
                                            ? 'text-amber-300 hover:bg-amber-500/20'
                                            : 'text-emerald-300 hover:bg-emerald-500/20'
                                        }`}
                                    style={{ border: `1px solid ${admin.is_active ? 'rgba(251, 191, 36, 0.3)' : 'rgba(52, 211, 153, 0.3)'}` }}
                                >
                                    {admin.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                    {admin.is_active ? 'Disable' : 'Enable'}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {admins.length === 0 && (
                <div className="text-center py-16">
                    <Users className="w-16 h-16 text-violet-500/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No admin users</h3>
                    <p className="text-violet-400">Add your first admin user to get started</p>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingAdmin ? 'Edit Admin User' : 'Add Admin User'}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-violet-200 mb-2">
                            Email Address
                        </label>
                        <input
                            {...register('email')}
                            type="email"
                            disabled={!!editingAdmin}
                            placeholder="admin@example.com"
                            className="w-full px-4 py-3 rounded-xl text-white placeholder-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-violet-200 mb-2">
                            Full Name
                        </label>
                        <input
                            {...register('full_name')}
                            type="text"
                            placeholder="John Doe"
                            className="w-full px-4 py-3 rounded-xl text-white placeholder-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                        />
                        {errors.full_name && <p className="mt-1 text-sm text-red-400">{errors.full_name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-violet-200 mb-2">
                            Role
                        </label>
                        <select
                            {...register('role')}
                            className="w-full px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            <option value="analyst">Analyst (View Only)</option>
                            <option value="admin">Admin (Manage Businesses)</option>
                            <option value="super_admin">Super Admin (Full Control)</option>
                        </select>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="flex-1 py-3 rounded-xl font-medium text-violet-300 transition-all hover:bg-violet-500/20"
                            style={{ border: '1px solid rgba(139, 92, 246, 0.3)' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-3 rounded-xl font-medium text-white transition-all hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{
                                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
                            }}
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingAdmin ? 'Update' : 'Add'} Admin
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
