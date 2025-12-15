import { useState, useEffect } from 'react';
import { Save, Loader2, Building, User, Phone, MapPin, Moon, Sun, Lock, Upload, Camera, Shield, Palette } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';

const settingsSchema = z.object({
    business_name: z.string().min(2, "Business Name is required"),
    owner_name: z.string().min(2, "Owner Name is required"),
    phone_number: z.string().min(10, "Phone number is required"),
    address: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export function SettingsPage() {
    const { user, profile, refreshProfile } = useAuth();
    const { success, error: toastError } = useToast();
    const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'security'>('profile');
    const [submitting, setSubmitting] = useState(false);

    // Password State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordSubmitting, setPasswordSubmitting] = useState(false);

    // Theme State
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
        }
        return 'light';
    });

    const { register, handleSubmit, formState: { errors }, reset } = useForm<SettingsFormData>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            business_name: '',
            owner_name: '',
            phone_number: '',
            address: '',
        }
    });

    useEffect(() => {
        if (profile) {
            reset({
                business_name: profile.business_name || '',
                owner_name: profile.owner_name || '',
                phone_number: profile.phone_number || '',
                address: profile.address || '',
            });
        }
    }, [profile, reset]);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const onSubmitProfile = async (data: SettingsFormData) => {
        if (!user) return;
        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('businesses')
                .upsert({
                    ...data,
                    user_id: user.id,
                    ...(profile?.id ? { id: profile.id } : {})
                }, { onConflict: 'user_id' });

            if (error) throw error;
            await refreshProfile();
            success('Settings updated successfully!');
        } catch (error) {
            console.error('Error updating settings:', error);
            toastError('Failed to update settings.');
        } finally {
            setSubmitting(false);
        }
    };

    const onChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toastError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            toastError('Password must be at least 6 characters.');
            return;
        }

        setPasswordSubmitting(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            success('Password updated successfully!');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Error changing password:', error);
            toastError(error.message || 'Failed to update password.');
        } finally {
            setPasswordSubmitting(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Business Profile', icon: Building },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'security', label: 'Security', icon: Shield },
    ] as const;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
                    <p className="mt-2 text-sm text-gray-500">Manage your business preferences and account security.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <Card className="lg:w-64 h-fit p-2 sticky top-[100px]">
                    <nav className="space-y-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                                        activeTab === tab.id
                                            ? "bg-primary-50 text-primary-700 shadow-sm"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                >
                                    <Icon className={cn("mr-3 h-5 w-5", activeTab === tab.id ? "text-primary-600" : "text-gray-400")} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </Card>

                {/* Content Area */}
                <div className="flex-1 space-y-6">
                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6 animate-in fade-in duration-300 slide-in-from-bottom-2">
                            {/* Logo Section */}
                            <Card className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Business Logo</h3>
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden group-hover:border-primary-500 transition-colors">
                                            <Building className="h-10 w-10 text-gray-400" />
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Camera className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <Button variant="outline" size="sm" leftIcon={Upload}>Upload New Logo</Button>
                                        <p className="mt-2 text-xs text-gray-500">Recommended size: 500x500px. JPG, PNG or GIF.</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-6">Business Information</h3>
                                <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Building className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <input {...register('business_name')} className="block w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm h-10" />
                                            </div>
                                            {errors.business_name && <p className="mt-1 text-xs text-red-600">{errors.business_name.message}</p>}
                                        </div>

                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <User className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <input {...register('owner_name')} className="block w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm h-10" />
                                            </div>
                                            {errors.owner_name && <p className="mt-1 text-xs text-red-600">{errors.owner_name.message}</p>}
                                        </div>

                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Phone className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <input {...register('phone_number')} className="block w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm h-10" />
                                            </div>
                                            {errors.phone_number && <p className="mt-1 text-xs text-red-600">{errors.phone_number.message}</p>}
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Address / Location</label>
                                            <div className="relative">
                                                <div className="absolute top-3 left-3 flex items-center pointer-events-none">
                                                    <MapPin className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <textarea {...register('address')} rows={3} className="block w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-3" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-gray-100">
                                        <Button type="submit" variant="primary" isLoading={submitting} leftIcon={Save}>
                                            Save Changes
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        </div>
                    )}

                    {/* APPEARANCE TAB */}
                    {activeTab === 'appearance' && (
                        <div className="space-y-6 animate-in fade-in duration-300 slide-in-from-bottom-2">
                            <Card className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-6">Theme Settings</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <div className="flex items-center">
                                            <div className={cn("p-2 rounded-lg", theme === 'dark' ? "bg-indigo-100 text-indigo-600" : "bg-orange-100 text-orange-600")}>
                                                {theme === 'dark' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-bold text-gray-900">Dark Mode</p>
                                                <p className="text-xs text-gray-500">Reduce eye strain in low light conditions.</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                            className={cn(
                                                "relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500",
                                                theme === 'dark' ? 'bg-primary-600' : 'bg-gray-200'
                                            )}
                                        >
                                            <span className={cn(
                                                "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200",
                                                theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                                            )} />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <div className="space-y-6 animate-in fade-in duration-300 slide-in-from-bottom-2">
                            <Card className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-6">Change Password</h3>
                                <form onSubmit={onChangePassword} className="space-y-6 max-w-md">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm h-10 px-3"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm h-10 px-3"
                                            required
                                            minLength={6}
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <Button type="submit" variant="primary" isLoading={passwordSubmitting} leftIcon={Lock}>
                                            Update Password
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
