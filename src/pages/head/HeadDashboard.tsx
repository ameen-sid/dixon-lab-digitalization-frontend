import DashboardLayout from '../layouts/DashboardLayout';
import { Award, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';

export default function HeadDashboard() {
	return (
		<DashboardLayout
			title="Directorate Approval Portal"
			description="Audit testing results, adjudicate failed reports, and release certified NABL approvals."
		>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">				
				<div className="bg-white border border-zinc-200 rounded-xl p-6 flex items-center justify-between shadow-md shadow-zinc-100/50">
					<div>
						<span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Awaiting Sign-off</span>
						<h3 className="text-3xl font-bold text-zinc-900 mt-1">14 Plans</h3>
						<p className="text-amber-600 text-xs mt-2 font-medium">Requires immediate action</p>
					</div>
					<div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-lg flex items-center justify-center border border-violet-100">
						<AlertCircle className="w-6 h-6" />
					</div>
				</div>
				<div className="bg-white border border-zinc-200 rounded-xl p-6 flex items-center justify-between shadow-md shadow-zinc-100/50">
					<div>
						<span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Reports Certified</span>
						<h3 className="text-3xl font-bold text-zinc-900 mt-1">428</h3>
						<p className="text-emerald-600 text-xs mt-2 font-medium">99.8% compliance rate</p>
					</div>
					<div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
						<CheckCircle2 className="w-6 h-6" />
					</div>
				</div>
				<div className="bg-white border border-zinc-200 rounded-xl p-6 flex items-center justify-between shadow-md shadow-zinc-100/50 sm:col-span-2 lg:col-span-1">
					<div>
						<span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Adjudications Resolved</span>
						<h3 className="text-3xl font-bold text-zinc-900 mt-1">36 Resolves</h3>
						<p className="text-zinc-500 text-xs mt-2 font-medium">No backlogs remaining</p>
					</div>
					<div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center border border-amber-100">
						<FileSpreadsheet className="w-6 h-6" />
					</div>
				</div>
			</div>
			<div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-md shadow-zinc-100/50 flex-1 flex flex-col justify-center items-center text-center">
				<div className="w-16 h-16 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-center text-zinc-500 shadow-inner mb-4">
					<Award className="w-8 h-8 text-violet-500" />
				</div>
				<h2 className="text-xl font-bold text-zinc-900 tracking-tight">Directorate Console: Ready</h2>
				<p className="text-zinc-500 max-w-lg mt-2 text-sm font-light leading-relaxed">
					Welcome to the Laboratory Head's Command Console. All pending evaluations, failure reports, and NABL certified plans are queued. The approval authorization keys are connected.
				</p>
			</div>
		</DashboardLayout>
	);
}