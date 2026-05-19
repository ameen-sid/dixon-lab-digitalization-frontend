import DashboardLayout from '../layouts/DashboardLayout';
import { Cpu, CheckSquare, RefreshCw, BarChart2 } from 'lucide-react';

export default function EngineerDashboard() {
	return (
		<DashboardLayout
			title="Engineering Test Console"
			description="Log raw sensor records, perform physical testing sequences, and upload test reports."
		>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				<div className="bg-white border border-zinc-200 rounded-xl p-6 flex items-center justify-between shadow-md shadow-zinc-100/50">
					<div>
						<span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">My Assigned Tests</span>
						<h3 className="text-3xl font-bold text-zinc-900 mt-1">6 Active</h3>
						<p className="text-amber-600 text-xs mt-2 font-medium">2 pending calibration</p>
					</div>
					<div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-lg flex items-center justify-center border border-violet-100">
						<Cpu className="w-6 h-6" />
					</div>
				</div>
				<div className="bg-white border border-zinc-200 rounded-xl p-6 flex items-center justify-between shadow-md shadow-zinc-100/50">
					<div>
						<span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Sequences Run</span>
						<h3 className="text-3xl font-bold text-zinc-900 mt-1">94 Run</h3>
						<p className="text-emerald-600 text-xs mt-2 font-medium">99.2% diagnostics pass</p>
					</div>
					<div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
						<CheckSquare className="w-6 h-6" />
					</div>
				</div>
				<div className="bg-white border border-zinc-200 rounded-xl p-6 flex items-center justify-between shadow-md shadow-zinc-100/50 sm:col-span-2 lg:col-span-1">
					<div>
						<span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Calibration Sync</span>
						<h3 className="text-3xl font-bold text-zinc-900 mt-1">Synchronized</h3>
						<p className="text-zinc-500 text-xs mt-2 font-medium">Last checked 2 hours ago</p>
					</div>
					<div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
						<RefreshCw className="w-6 h-6" />
					</div>
				</div>
			</div>
			<div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-md shadow-zinc-100/50 flex-1 flex flex-col justify-center items-center text-center">
				<div className="w-16 h-16 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-center text-zinc-500 shadow-inner mb-4">
					<BarChart2 className="w-8 h-8 text-emerald-500" />
				</div>
				<h2 className="text-xl font-bold text-zinc-900 tracking-tight">Engineering Workspace: Connected</h2>
				<p className="text-zinc-500 max-w-lg mt-2 text-sm font-light leading-relaxed">
					Welcome to the Testing Engineer Workspace. Active lab equipment logs, instrument feeds, diagnostics telemetry, and test plans are fully synchronized. Your workspace is configured.
				</p>
			</div>
		</DashboardLayout>
	);
}