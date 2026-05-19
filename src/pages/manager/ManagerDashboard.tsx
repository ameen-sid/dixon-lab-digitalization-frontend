import DashboardLayout from '../layouts/DashboardLayout';
import { CalendarRange, Activity, Settings, Users } from 'lucide-react';

export default function ManagerDashboard() {
	return (
		<DashboardLayout
			title="Laboratory Manager Control Hub"
			description="Coordinate testing workloads, assign equipment, manage calibrations, and supervise engineers."
		>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">				
				<div className="bg-white border border-zinc-200 rounded-xl p-6 flex items-center justify-between shadow-md shadow-zinc-100/50">
					<div>
						<span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Busy Instruments</span>
						<h3 className="text-3xl font-bold text-zinc-900 mt-1">18 / 24</h3>
						<p className="text-emerald-600 text-xs mt-2 font-medium">75% utilization efficiency</p>
					</div>
					<div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-100">
						<Activity className="w-6 h-6" />
					</div>
				</div>
				<div className="bg-white border border-zinc-200 rounded-xl p-6 flex items-center justify-between shadow-md shadow-zinc-100/50">
					<div>
						<span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Supervised Staff</span>
						<h3 className="text-3xl font-bold text-zinc-900 mt-1">12 Duty</h3>
						<p className="text-zinc-500 text-xs mt-2 font-medium">Engineers and inspectors</p>
					</div>
					<div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-lg flex items-center justify-center border border-violet-100">
						<Users className="w-6 h-6" />
					</div>
				</div>
				<div className="bg-white border border-zinc-200 rounded-xl p-6 flex items-center justify-between shadow-md shadow-zinc-100/50 sm:col-span-2 lg:col-span-1">
					<div>
						<span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Calibrations Due</span>
						<h3 className="text-3xl font-bold text-zinc-900 mt-1">2 Alerts</h3>
						<p className="text-amber-600 text-xs mt-2 font-medium">Scheduled for next Tuesday</p>
					</div>
					<div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center border border-amber-100">
						<Settings className="w-6 h-6" />
					</div>
				</div>
			</div>
			<div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-md shadow-zinc-100/50 flex-1 flex flex-col justify-center items-center text-center">
				<div className="w-16 h-16 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-center text-zinc-500 shadow-inner mb-4">
					<CalendarRange className="w-8 h-8 text-indigo-500" />
				</div>
				<h2 className="text-xl font-bold text-zinc-900 tracking-tight">Lab Management Portal: Active</h2>
				<p className="text-zinc-500 max-w-lg mt-2 text-sm font-light leading-relaxed">
					Welcome to the Lab Manager Dashboard. Real-time machine logs, duty rosters, calibration intervals, and testing queues are fully populated. Shift operations are standard.
				</p>
			</div>
		</DashboardLayout>
	);
}