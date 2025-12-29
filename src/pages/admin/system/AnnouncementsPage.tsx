import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Megaphone,
    Plus,
    Edit,
    Trash2,
    Loader2,
    RefreshCw,
    Calendar,
    AlertCircle,
    CheckCircle,
    AlertTriangle,
    Info,
    Eye,
    EyeOff
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { Modal } from '../../../components/ui/Modal';
import type { PlatformAnnouncement } from '../../../types';

const announcementSchema = z.object({
    title: z.string().min(3, 'Title is required'),
    content: z.string().min(10, 'Content must be at least 10 characters'),
    type: z.enum(['info', 'warning', 'success', 'error']),
    target_audience: z.enum(['all', 'new_users', 'active_users']),
    starts_at: z.string(),
    ends_at: z.string().optional(),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

export function AnnouncementsPage() {
    const { adminProfile } = useAdminAuth();
    const [loading, setLoading] = useState(true);
    const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<PlatformAnnouncement | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AnnouncementFormData>({
        resolver: zodResolver(announcementSchema),
        defaultValues: {
            type: 'info',
            target_audience: 'all',
            starts_at: new Date().toISOString().split('T')[0],
        }
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('platform_announcements')
                .select('*, admin_users(full_name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAnnouncements(data || []);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (announcement?: PlatformAnnouncement) => {
        if (announcement) {
            setEditingAnnouncement(announcement);
            setValue('title', announcement.title);
            setValue('content', announcement.content);
            setValue('type', announcement.type);
            setValue('target_audience', announcement.target_audience);
            setValue('starts_at', announcement.starts_at.split('T')[0]);
            setValue('ends_at', announcement.ends_at?.split('T')[0] || '');
        } else {
            setEditingAnnouncement(null);
            reset({
                title: '',
                content: '',
                type: 'info',
                target_audience: 'all',
                starts_at: new Date().toISOString().split('T')[0],
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingAnnouncement(null);
        reset();
    };

    const onSubmit = async (data: AnnouncementFormData) => {
        setSubmitting(true);
        try {
            const payload = {
                title: data.title,
                content: data.content,
                type: data.type,
                target_audience: data.target_audience,
                starts_at: new Date(data.starts_at).toISOString(),
                ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : null,
                admin_id: adminProfile?.id,
            };

            if (editingAnnouncement) {
                const { error } = await supabase
                    .from('platform_announcements')
                    .update(payload)
                    .eq('id', editingAnnouncement.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('platform_announcements')
                    .insert(payload);

                if (error) throw error;
            }

            await fetchAnnouncements();
            closeModal();
        } catch (error: any) {
            alert(error.message || 'Failed to save announcement');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleAnnouncementStatus = async (announcement: PlatformAnnouncement) => {
        try {
            const { error } = await supabase
                .from('platform_announcements')
                .update({ is_active: !announcement.is_active })
                .eq('id', announcement.id);

            if (error) throw error;
            await fetchAnnouncements();
        } catch (error) {
            console.error('Error toggling announcement:', error);
        }
    };

    const deleteAnnouncement = async (announcement: PlatformAnnouncement) => {
        if (!confirm(`Are you sure you want to delete "${announcement.title}"?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('platform_announcements')
                .delete()
                .eq('id', announcement.id);

            if (error) throw error;
            await fetchAnnouncements();
        } catch (error) {
            console.error('Error deleting announcement:', error);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-emerald-400" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-amber-400" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-400" />;
            default:
                return <Info className="w-5 h-5 text-blue-400" />;
        }
    };

    const getTypeBg = (type: string) => {
        switch (type) {
            case 'success':
                return 'border-emerald-500/30 bg-emerald-500/10';
            case 'warning':
                return 'border-amber-500/30 bg-amber-500/10';
            case 'error':
                return 'border-red-500/30 bg-red-500/10';
            default:
                return 'border-blue-500/30 bg-blue-500/10';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
                    <p className="text-violet-300">Loading announcements...</p>
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
                        <Megaphone className="w-8 h-8 text-violet-400" />
                        Platform Announcements
                    </h1>
                    <p className="text-violet-300 mt-1">{announcements.length} announcements</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium transition-all hover:scale-105"
                        style={{
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
                        }}
                    >
                        <Plus className="w-4 h-4" />
                        New Announcement
                    </button>
                    <button
                        onClick={fetchAnnouncements}
                        className="p-2 rounded-xl text-violet-300 hover:bg-violet-500/20 transition-all"
                        style={{ border: '1px solid rgba(139, 92, 246, 0.3)' }}
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Announcements List */}
            <div className="space-y-4">
                {announcements.map((announcement) => (
                    <div
                        key={announcement.id}
                        className={`p-6 rounded-2xl border ${getTypeBg(announcement.type)} ${!announcement.is_active ? 'opacity-60' : ''}`}
                        style={{ backdropFilter: 'blur(20px)' }}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="mt-1">
                                    {getTypeIcon(announcement.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${announcement.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                                            }`}>
                                            {announcement.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-violet-300 mb-3">{announcement.content}</p>
                                    <div className="flex flex-wrap gap-4 text-sm text-violet-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            Starts: {new Date(announcement.starts_at).toLocaleDateString()}
                                        </span>
                                        {announcement.ends_at && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                Ends: {new Date(announcement.ends_at).toLocaleDateString()}
                                            </span>
                                        )}
                                        <span>Target: {announcement.target_audience.replace('_', ' ')}</span>
                                        <span>By: {(announcement as any).admin_users?.full_name || 'System'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => toggleAnnouncementStatus(announcement)}
                                    className="p-2 rounded-lg text-violet-300 hover:bg-violet-500/20 transition-all"
                                    title={announcement.is_active ? 'Deactivate' : 'Activate'}
                                >
                                    {announcement.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => openModal(announcement)}
                                    className="p-2 rounded-lg text-violet-300 hover:bg-violet-500/20 transition-all"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => deleteAnnouncement(announcement)}
                                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {announcements.length === 0 && (
                <div className="text-center py-16">
                    <Megaphone className="w-16 h-16 text-violet-500/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No announcements yet</h3>
                    <p className="text-violet-400">Create your first platform announcement</p>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-violet-200 mb-2">Title</label>
                        <input
                            {...register('title')}
                            type="text"
                            placeholder="Announcement title"
                            className="w-full px-4 py-3 rounded-xl text-white placeholder-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-violet-200 mb-2">Content</label>
                        <textarea
                            {...register('content')}
                            rows={4}
                            placeholder="Announcement message..."
                            className="w-full px-4 py-3 rounded-xl text-white placeholder-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                        />
                        {errors.content && <p className="mt-1 text-sm text-red-400">{errors.content.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-violet-200 mb-2">Type</label>
                            <select
                                {...register('type')}
                                className="w-full px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                            >
                                <option value="info">ℹ️ Information</option>
                                <option value="success">✅ Success</option>
                                <option value="warning">⚠️ Warning</option>
                                <option value="error">❌ Error/Alert</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-violet-200 mb-2">Target Audience</label>
                            <select
                                {...register('target_audience')}
                                className="w-full px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                            >
                                <option value="all">All Users</option>
                                <option value="new_users">New Users Only</option>
                                <option value="active_users">Active Users Only</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-violet-200 mb-2">Start Date</label>
                            <input
                                {...register('starts_at')}
                                type="date"
                                className="w-full px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-violet-200 mb-2">End Date (Optional)</label>
                            <input
                                {...register('ends_at')}
                                type="date"
                                className="w-full px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                            />
                        </div>
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
                            {editingAnnouncement ? 'Update' : 'Create'} Announcement
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
