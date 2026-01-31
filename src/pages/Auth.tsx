import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const Auth = () => {
    const [searchParams] = useSearchParams();
    const isSignUpInitial = searchParams.get('signup') === 'true';
    const [isSignUp, setIsSignUp] = useState(isSignUpInitial);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        }
                    }
                });
                if (error) throw error;
                // In this specific demo context, we assume auto-confirm is enabled or we guide the user
                alert('Account created! Please check your email if confirmation is required, otherwise you can now sign in.');
                setIsSignUp(false);
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 border border-slate-100 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="h-20 w-20 text-ocean-600" />
                </div>

                <div className="text-center mb-10 relative z-10">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-ocean-50 text-ocean-600 mb-6">
                        <Sparkles className="h-8 w-8" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                        {isSignUp ? 'Join Ocepa' : 'Welcome Back'}
                    </h2>
                    <p className="text-slate-500 mt-3 text-lg">
                        {isSignUp ? 'Unlock your learning potential.' : 'Continue your learning journey.'}
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100 flex items-center gap-2"
                    >
                        <div className="h-1.5 w-1.5 rounded-full bg-red-600" />
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleAuth} className="space-y-5 relative z-10">
                    {isSignUp && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                        >
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all bg-slate-50"
                                placeholder="John Doe"
                            />
                        </motion.div>
                    )}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all bg-slate-50"
                            placeholder="name@university.edu"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all bg-slate-50"
                            placeholder="••••••••"
                        />
                    </div>

                    <Button type="submit" className="w-full py-7 text-lg rounded-xl shadow-lg shadow-ocean-500/25 mt-2" disabled={loading}>
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : isSignUp ? 'Create Free Account' : 'Sign In'}
                    </Button>
                </form>

                <div className="mt-8 text-center text-slate-600">
                    {isSignUp ? 'Have an account?' : "New to Ocepa?"}{' '}
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-ocean-600 font-bold hover:text-ocean-700 transition-colors"
                    >
                        {isSignUp ? 'Sign in instead' : 'Create an account'}
                    </button>
                </div>

                <div className="mt-10 border-t border-slate-100 pt-8 text-center">
                    <Link to="/" className="text-sm font-medium text-slate-400 hover:text-ocean-500 flex items-center justify-center gap-2 mx-auto transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Back to Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};
