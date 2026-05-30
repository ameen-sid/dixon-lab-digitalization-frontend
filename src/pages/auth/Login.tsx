import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader } from 'lucide-react';
import { login } from '../../services/operations/authService';

export default function Login() {
	const navigate = useNavigate();

	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!username.trim() || !password.trim()) {
			setError('Please enter both username and password.');
			return;
		}

		setIsLoading(true);
		setError('');
		try {
			const action = login(username.trim(), password);
			await action();
			navigate('/dashboard');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unable to connect to the server.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f8fafc] p-6 relative overflow-hidden">
			<div className="flex flex-col items-center mb-8 relative z-10 filter drop-shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
				<img src="/logo.png" alt="Dixon Logo" className="h-24 w-auto object-contain transition-all duration-300 hover:scale-[1.02]" />
			</div>

			<div className="w-full max-w-93.75 bg-white/95 backdrop-blur-xl border border-zinc-200/60 rounded-2xl py-12 px-7 shadow-[0_30px_70px_rgba(15,23,42,0.08)] relative z-10 transition-all duration-300 hover:shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
				<div className="mb-9 text-center">
					<h2 className="text-lg font-bold tracking-tight leading-snug text-[#11236a]" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
						Lab Testing Request & Approval Portal
					</h2>
				</div>
				{error && (
					<div className="mb-6 flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs transition-all duration-200">
						<AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
						<span className="leading-relaxed font-medium">{error}</span>
					</div>
				)}
				
				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2" htmlFor="username">Username</label>
						<input
							id="username"
							type="text"
							autoComplete="username"
							placeholder="Enter your username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							disabled={isLoading}
							className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 placeholder-zinc-500 outline-none text-sm transition-all duration-200 focus:border-[#11236a] focus:ring-4 focus:ring-[#11236a]/5 focus:bg-white"
						/>
					</div>

					<div>
						<label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2" htmlFor="password">Password</label>
						<div className="relative">
							<input
								id="password"
								type={showPassword ? 'text' : 'password'}
								autoComplete="current-password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								disabled={isLoading}
								className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl pl-4 pr-11 py-3 text-zinc-800 placeholder-zinc-500 outline-none text-sm transition-all duration-200 focus:border-[#11236a] focus:ring-4 focus:ring-[#11236a]/5 focus:bg-white"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-zinc-650 transition-colors cursor-pointer"
							>
								{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
							</button>
						</div>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className="w-full mt-4 bg-[#11236a] hover:bg-[#0c1a52] text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 outline-none active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer text-xs uppercase tracking-wider shadow-lg shadow-[#11236a]/15 hover:shadow-xl hover:shadow-[#11236a]/30 hover:scale-[1.01]"
					>
						{isLoading ? (
							<>
								<Loader className="w-3.5 h-3.5 animate-spin" />
								<span>Authorizing...</span>
							</>
						) : (
							<span>Access Hub</span>
						)}
					</button>
				</form>
			</div>

			<div className="mt-8 text-center relative z-10">
				<p className="text-zinc-500 text-[10px] font-normal tracking-wide">© 2026 Dixon Technologies</p>
			</div>
		</div>
	);
}
