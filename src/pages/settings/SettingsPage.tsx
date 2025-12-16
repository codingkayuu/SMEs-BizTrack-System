import { useState, useEffect } from 'react';
import { Save, Building, User, Phone, MapPin, Moon, Sun, Lock, Upload, Camera, Shield, Palette } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '../../components/ui/Card';
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
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span className="w-2 h-8 rounded-full bg-purple-600 block"></span>
                        Settings
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Manage your business preferences and account security.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <Card className="lg:w-64 h-fit p-3 sticky top-[100px] border-purple-100 shadow-sm bg-white dark:bg-slate-800 rounded-2xl md:min-w-[250px]">
                    <nav className="space-y-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-300",
                                        activeTab === tab.id
                                            ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-slate-700 hover:text-purple-700"
                                    )}
                                >
                                    <Icon className={cn("mr-3 h-5 w-5", activeTab === tab.id ? "text-white" : "text-gray-400 group-hover:text-purple-600")} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </Card>

                {/* Content Area */}
                <div className="flex-1 space-y-6 stagger-2 animate-fade-in-up">
                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6 animate-in fade-in duration-300 slide-in-from-bottom-2">
                            {/* Logo Section */}
                            <Card className="p-8 border-purple-100 shadow-sm bg-white dark:bg-slate-800 rounded-3xl">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg mr-3">
                                        <Camera className="h-5 w-5 text-purple-600" />
                                    </div>
                                    Business Logo
                                </h3>
                                <div className="flex items-center gap-8">
                                    <div className="relative group">
                                        <div className="h-32 w-32 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center border-4 border-white dark:border-slate-700 shadow-lg overflow-hidden group-hover:border-purple-600 transition-colors duration-300">
                                            <Building className="h-12 w-12 text-gray-300" />
                                        </div>
                                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                                            <Upload className="h-8 w-8 text-white scale-75 group-hover:scale-100 transition-transform duration-300" />
                                        </div>
                                    </div>
                                    <div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            leftIcon={Upload}
                                            className="border-gray-300 hover:border-purple-600 hover:text-purple-600 transition-all"
                                        >
                                            Upload New Logo
                                        </Button>
                                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Supported formats: JPG, PNG, GIF.<br />Max size: 5MB.</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-8 border-purple-100 shadow-sm bg-white dark:bg-slate-800 rounded-3xl">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg mr-3">
                                        <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    Business Information
                                </h3>
                                <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-8">
                                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Business Name</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Building className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input {...register('business_name')} className="block w-full pl-12 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-purple-600 focus:border-purple-600 bg-white dark:bg-slate-900 sm:text-sm h-12 transition-all" placeholder="e.g. Lusaka Logistics" />
                                            </div>
                                            {errors.business_name && <p className="mt-1 text-xs text-red-600">{errors.business_name.message}</p>}
                                        </div>

                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Owner Name</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <User className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input {...register('owner_name')} className="block w-full pl-12 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-purple-600 focus:border-purple-600 bg-white dark:bg-slate-900 sm:text-sm h-12 transition-all" placeholder="Full Name" />
                                            </div>
                                            {errors.owner_name && <p className="mt-1 text-xs text-red-600">{errors.owner_name.message}</p>}
                                        </div>

                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Phone className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input {...register('phone_number')} className="block w-full pl-12 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-purple-600 focus:border-purple-600 bg-white dark:bg-slate-900 sm:text-sm h-12 transition-all" placeholder="+260..." />
                                            </div>
                                            {errors.phone_number && <p className="mt-1 text-xs text-red-600">{errors.phone_number.message}</p>}
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address / Location</label>
                                            <div className="relative">
                                                <div className="absolute top-4 left-4 flex items-center pointer-events-none">
                                                    <MapPin className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <textarea {...register('address')} rows={3} className="block w-full pl-12 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-purple-600 focus:border-purple-600 bg-white dark:bg-slate-900 sm:text-sm p-4 transition-all" placeholder="Street Address, City, Province" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-gray-700/50">
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            isLoading={submitting}
                                            leftIcon={Save}
                                            className="px-8 py-3 h-auto text-base rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                                        >
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
                            <Card className="p-8 border-purple-100 shadow-sm bg-white dark:bg-slate-800 rounded-3xl">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg mr-3">
                                        <Palette className="h-5 w-5 text-orange-600" />
                                    </div>
                                    Theme Settings
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 transition-all hover:border-purple-400/50">
                                        <div className="flex items-center">
                                            <div className={cn("p-3 rounded-full shadow-inner", theme === 'dark' ? "bg-indigo-100 text-indigo-600" : "bg-orange-100 text-orange-600")}>
                                                {theme === 'dark' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
                                            </div>
                                            <div className="ml-5">
                                                <p className="text-base font-bold text-gray-900 dark:text-white">Dark Mode</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Reduce eye strain in low light conditions.</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                            className={cn(
                                                "relative inline-flex flex-shrink-0 h-8 w-14 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600",
                                                theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200'
                                            )}
                                        >
                                            <span className={cn(
                                                "pointer-events-none inline-block h-7 w-7 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200",
                                                theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
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
                            <Card className="p-8 border-purple-100 shadow-sm bg-white dark:bg-slate-800 rounded-3xl">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg mr-3">
                                        <Shield className="h-5 w-5 text-red-600" />
                                    </div>
                                    Change Password
                                </h3>
                                <form onSubmit={onChangePassword} className="space-y-6 max-w-lg">
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-6">
                                        <p className="text-sm text-yellow-700 dark:text-yellow-200">Make sure your new password is at least 6 characters long and includes a mix of letters and numbers.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="block w-full border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-purple-600 focus:border-purple-600 bg-white dark:bg-slate-900 sm:text-sm h-12 px-4 transition-all"
                                                required
                                                minLength={6}
                                                placeholder="••••••••"
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="block w-full border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-purple-600 focus:border-purple-600 bg-white dark:bg-slate-900 sm:text-sm h-12 px-4 transition-all"
                                                required
                                                minLength={6}
                                                placeholder="••••••••"
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            isLoading={passwordSubmitting}
                                            leftIcon={Lock}
                                            className="w-full bg-red-600 hover:bg-red-700 border-none shadow-lg shadow-red-500/20 py-3 rounded-xl"
                                        >
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
