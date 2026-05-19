import DashboardLayout from '../layouts/DashboardLayout';
import { SearchCode, FileCheck, ClipboardList, CheckSquare } from 'lucide-react';

export default function InspectorDashboard() {
	return (
		<DashboardLayout
			title="Sample Quality Inspection Hub"
			description="Log batch visual parameters, audit dimensional reports, and file compliance logs."
		>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">				
				<div className="bg-white border border-zinc-200 rounded-xl p-6 flex items-center justify-between shadow-md shadow-zinc-100/50">
					<div>
						<span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Awaiting Inspection</span>
						<h3 className="text-3xl font-bold text-zinc-900 mt-1">8 Batches</h3>
						<p className="text-amber-600 text-xs mt-2 font-medium">3 arrival checks priority</p>
					</div>
					<div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-lg flex items-center justify-center border border-cyan-100">
						<ClipboardList className="w-6 h-6" />
					</div>
				</div>
				<div className="bg-white border border-zinc-200 rounded-xl p-6 flex items-center justify-between shadow-md shadow-zinc-100/50">
					<div>
						<span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Inspected Batches</span>
						<h3 className="text-3xl font-bold text-zinc-900 mt-1">112</h3>
						<p className="text-emerald-600 text-xs mt-2 font-medium">98.5% compliance rating</p>
					</div>
					<div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
						<FileCheck className="w-6 h-6" />
					</div>
				</div>
				<div className="bg-white border border-zinc-200 rounded-xl p-6 flex items-center justify-between shadow-md shadow-zinc-100/50 sm:col-span-2 lg:col-span-1">
					<div>
						<span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Pending Adjudications</span>
						<h3 className="text-3xl font-bold text-zinc-900 mt-1">0 Pending</h3>
						<p className="text-emerald-600 text-xs mt-2 font-medium">Clear of queue lag</p>
					</div>
					<div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
						<CheckSquare className="w-6 h-6" />
					</div>
				</div>
			</div>
			<div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-md shadow-zinc-100/50 flex-1 flex flex-col justify-center items-center text-center">
				<div className="w-16 h-16 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-center text-zinc-500 shadow-inner mb-4">
					<SearchCode className="w-8 h-8 text-cyan-500" />
				</div>
				<h2 className="text-xl font-bold text-zinc-900 tracking-tight">Inspection Workspace: Ready</h2>
				<p className="text-zinc-500 max-w-lg mt-2 text-sm font-light leading-relaxed">
					Welcome to the Quality Inspector Workspace. Batch inspection queues, sample registry logs, dimensional criteria sheets, and diagnostic test plans are fully synchronized. Your workspace is configured.
				</p>
			</div>
		</DashboardLayout>
	);
}