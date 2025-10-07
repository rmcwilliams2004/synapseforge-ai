import React, { useState } from 'react';
import { User } from '../types';

interface AuthPageProps {
    onLogin: (name: string, pass: string) => User | null;
    onSignUp: (name: string, pass: string) => User | null;
}

export const AuthPage = ({ onLogin, onSignUp }: AuthPageProps) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name || !password) {
            setError('Both name and password are required.');
            return;
        }

        if (isSignUp) {
            const user = onSignUp(name, password);
            if (!user) {
                setError('A user with this name already exists.');
            }
        } else {
            const user = onLogin(name, password);
            if (!user) {
                setError('Invalid credentials. Please try again.');
            }
        }
    };

    const handleDemoLogin = (demoName: string) => {
        onLogin(demoName, 'password123');
    }

    return (
        <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4">
            <div className="flex items-center gap-3 mb-8">
                <svg className="w-12 h-12 text-brand-cyan" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" fill="currentColor"/>
                </svg>
                <div>
                    <h1 className="text-4xl font-bold text-brand-light tracking-wider">
                        Synapse<span className="text-brand-cyan">Forge</span> AI
                    </h1>
                    <p className="text-sm text-gray-400 -mt-1">AI-Powered Reverse Engineering & Product Analysis</p>
                </div>
            </div>

            <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-8 animate-fade-in">
                <h2 className="text-2xl font-bold text-center text-brand-light mb-6">
                    {isSignUp ? 'Create an Account' : 'Sign In'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300">Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white shadow-sm focus:outline-none focus:ring-brand-cyan focus:border-brand-cyan"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-gray-300">Password</label>
                         <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white shadow-sm focus:outline-none focus:ring-brand-cyan focus:border-brand-cyan"
                            required
                         />
                    </div>

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-cyan hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition active:scale-95"
                        >
                            {isSignUp ? 'Sign Up' : 'Sign In'}
                        </button>
                    </div>
                </form>

                 <p className="mt-6 text-center text-sm text-gray-400">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="font-medium text-brand-cyan hover:text-cyan-400 ml-1">
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-600" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="px-2 bg-gray-800 text-sm text-gray-400">Demo Access</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => handleDemoLogin('Alex (Admin)')}
                        className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-purple-500 rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 transition active:scale-95"
                    >
                        Sign in as Demo Admin
                    </button>
                     <button
                        onClick={() => handleDemoLogin('Blake (Demo User)')}
                        className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 transition active:scale-95"
                    >
                        Sign in as Demo User
                    </button>
                </div>
            </div>
        </div>
    );
};