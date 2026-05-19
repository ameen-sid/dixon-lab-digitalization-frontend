import DashboardLayout from '../layouts/DashboardLayout';
import { Send, FileText, CheckCircle, HelpCircle } from 'lucide-react';

export default function RequesterDashboard() {
	return (
		<DashboardLayout
			title="Lab Testing Request Center"
			description="Draft new product testing plans, submit samples, and track NABL approval telemetry."
		>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">				
				<div className="bg-white border border-zinc-200 rounded-xl p-6 flex items-center justify-between shadow-md shadow-zinc-100/50">
					<div>
						<span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">My Submissions</span>
						<h3 className="text-3xl font-bold text-zinc-900 mt-1">12 Requests</h3>
						<p className="text-zinc-500 text-xs mt-2 font-medium">8 completed, 4 ongoing</p>
					</div>
					<div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-100">
						<Send className="w-6 h-6" />
					</div>
				</div>
				<div className="bg-white border border-zinc-200 rounded-xl p-6 flex items-center justify-between shadow-md shadow-zinc-100/50">
					<div>
						<span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Certified Reports</span>
						<h3 className="text-3xl font-bold text-zinc-900 mt-1">8 Reports</h3>
						<p className="text-emerald-600 text-xs mt-2 font-medium">NABL stamped and signed</p>
					</div>
					<div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
						<CheckCircle className="w-6 h-6" />
					</div>
				</div>
				<div className="bg-white border border-zinc-200 rounded-xl p-6 flex items-center justify-between shadow-md shadow-zinc-100/50 sm:col-span-2 lg:col-span-1">
					<div>
						<span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Active Sequence</span>
						<h3 className="text-3xl font-bold text-zinc-900 mt-1">4 Testing</h3>
						<p className="text-amber-600 text-xs mt-2 font-medium">In engineering calibration</p>
					</div>
					<div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center border border-amber-100">
						<FileText className="w-6 h-6" />
					</div>
				</div>
			</div>
			<div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-md shadow-zinc-100/50 flex-1 flex flex-col justify-center items-center text-center">
				<div className="w-16 h-16 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-center text-zinc-500 shadow-inner mb-4">
					<HelpCircle className="w-8 h-8 text-indigo-500" />
				</div>
				<h2 className="text-xl font-bold text-zinc-900 tracking-tight">Requester Command Hub: Live</h2>
				<p className="text-zinc-500 max-w-lg mt-2 text-sm font-light leading-relaxed">
					Welcome to the Lab Request Center. You can draft new test procedures, attach batch certificates, track sample movement, and access certified lab reports here.
				</p>
			</div>
		</DashboardLayout>
	);
}