import { useEffect, useState } from 'react';
import {
    Settings,
    Save,
    Loader2,
    RefreshCw,
    Globe,
    Mail,
    DollarSign,
    Bell,
    Wrench,
    FileText,
    Building2
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import type { PlatformSetting } from '../../../types';

export function SettingsPage() {
    const { isSuperAdmin, adminProfile } = useAdminAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<{ [key: string]: any }>({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('platform_settings')
                .select('*');

            if (error) throw error;

            const settingsMap: { [key: string]: any } = {};
            data?.forEach(setting => {
                settingsMap[setting.key] = typeof setting.value === 'string'
                    ? setting.value.replace(/^"|"$/g, '')
                    : setting.value;
            });
            setSettings(settingsMap);
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            for (const [key, value] of Object.entries(settings)) {
                const storedValue = typeof value === 'string' ? `"${value}"` : value;
                const { error } = await supabase
                    .from('platform_settings')
                    .update({
                        value: storedValue,
                        updated_by: adminProfile?.id
                    })
                    .eq('key', key);

                if (error) throw error;
            }
            alert('Settings saved successfully!');
        } catch (error: any) {
            alert(error.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
                    <p className="text-violet-300">Loading settings...</p>
                </div>
            </div>
        );
    }

    if (!isSuperAdmin) {
        return (
            <div className="text-center py-16">
                <Settings className="w-16 h-16 text-violet-500/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Access Restricted</h3>
                <p className="text-violet-400">Only super administrators can modify platform settings</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                        <Settings className="w-8 h-8 text-violet-400" />
                        Platform Settings
                    </h1>
                    <p className="text-violet-300 mt-1">Configure your BizTrack platform</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={saveSettings}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium transition-all hover:scale-105 disabled:opacity-50"
                        style={{
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
                        }}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                    <button
                        onClick={fetchSettings}
                        className="p-2 rounded-xl text-violet-300 hover:bg-violet-500/20 transition-all"
                        style={{ border: '1px solid rgba(139, 92, 246, 0.3)' }}
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Settings Sections */}
            <div className="grid gap-6">
                {/* General Settings */}
                <div className="p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-violet-400" />
                        General Settings
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-violet-200 mb-2">
                                Platform Name
                            </label>
                            <input
                                type="text"
                                value={settings.platform_name || ''}
                                onChange={(e) => updateSetting('platform_name', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-violet-200 mb-2">
                                Support Email
                            </label>
                            <input
                                type="email"
                                value={settings.support_email || ''}
                                onChange={(e) => updateSetting('support_email', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Business Settings */}
                <div className="p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-violet-400" />
                        Business Settings
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-violet-200 mb-2">
                                Max Businesses Per User
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={settings.max_businesses_per_user || 1}
                                onChange={(e) => updateSetting('max_businesses_per_user', parseInt(e.target.value))}
                                className="w-full px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                            />
                            <p className="mt-1 text-xs text-violet-400">Number of businesses a user can create</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-violet-200 mb-2">
                                Default Currency
                            </label>
                            <select
                                value={settings.default_currency || 'ZMW'}
                                onChange={(e) => updateSetting('default_currency', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                            >
                                <option value="ZMW">ZMW - Zambian Kwacha</option>
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Invoice Settings */}
                <div className="p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-violet-400" />
                        Invoice Settings
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-violet-200 mb-2">
                                Invoice Number Prefix
                            </label>
                            <input
                                type="text"
                                value={settings.invoice_prefix || 'INV'}
                                onChange={(e) => updateSetting('invoice_prefix', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                            />
                            <p className="mt-1 text-xs text-violet-400">e.g., INV-001, BILL-001</p>
                        </div>
                    </div>
                </div>

                {/* System Settings */}
                <div className="p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-violet-400" />
                        System Settings
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl" style={{
                            background: 'rgba(139, 92, 246, 0.1)'
                        }}>
                            <div className="flex items-center gap-3">
                                <Bell className="w-5 h-5 text-violet-400" />
                                <div>
                                    <p className="text-white font-medium">Enable Notifications</p>
                                    <p className="text-sm text-violet-400">Send platform notifications to users</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.enable_notifications === true || settings.enable_notifications === 'true'}
                                    onChange={(e) => updateSetting('enable_notifications', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-violet-900 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl" style={{
                            background: settings.maintenance_mode === true || settings.maintenance_mode === 'true'
                                ? 'rgba(239, 68, 68, 0.2)'
                                : 'rgba(139, 92, 246, 0.1)'
                        }}>
                            <div className="flex items-center gap-3">
                                <Wrench className={`w-5 h-5 ${settings.maintenance_mode === true || settings.maintenance_mode === 'true' ? 'text-red-400' : 'text-violet-400'}`} />
                                <div>
                                    <p className="text-white font-medium">Maintenance Mode</p>
                                    <p className="text-sm text-violet-400">Temporarily disable access for non-admins</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.maintenance_mode === true || settings.maintenance_mode === 'true'}
                                    onChange={(e) => updateSetting('maintenance_mode', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-violet-900 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
