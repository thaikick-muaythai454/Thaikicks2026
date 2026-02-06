
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { updateUserPassword } from '../services/authService';
import { Lock, Loader } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

    useEffect(() => {
        // Only allow access if established via recovery link (which logs user in with recovery type)
        // or effectively we just check session. 
        // Supabase "recovery" flow logs the user in automatically.
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // If no session, they might have clicked a link but something failed, or just navigated here.
                // But typically the link sets the session.
                // We'll let them try, if update fails it fails.
            }
        });

        // Listen for auth state change - specifically PASSWORD_RECOVERY
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                // Determine we are in recovery mode
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            await updateUserPassword(password);
            setMessage({ text: 'Password updated successfully! Redirecting...', type: 'success' });
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (error: any) {
            setMessage({ text: error.message || 'Failed to update password', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-bone flex items-center justify-center p-4 animate-reveal">
            <div className="bg-white p-8 w-full max-w-md border-2 border-brand-charcoal shadow-[8px_8px_0px_0px_#AE3A17]">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-charcoal text-white rounded-full mb-4">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black uppercase text-brand-charcoal">Set New Password</h2>
                    <p className="font-mono text-xs text-gray-500 mt-2">Enter your new secure password below.</p>
                </div>

                {message && (
                    <div className={`p-4 mb-6 font-mono text-xs font-bold uppercase border-2 ${message.type === 'success'
                            ? 'bg-green-50 border-green-500 text-green-700'
                            : 'bg-red-50 border-brand-red text-brand-red'
                        }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="space-y-2">
                        <label className="font-mono text-xs font-bold uppercase">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-brand-bone border-2 border-gray-200 p-3 font-mono text-brand-charcoal focus:border-brand-blue focus:outline-none"
                            placeholder="Min 6 characters"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-charcoal text-white font-black uppercase py-4 hover:bg-brand-blue transition-colors flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
                    >
                        {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
