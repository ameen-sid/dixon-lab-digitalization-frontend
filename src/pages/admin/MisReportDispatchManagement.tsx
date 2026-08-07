import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, FileText, FileSpreadsheet, Send, Clock } from 'lucide-react';
import { apiConnector } from '../../services/apiConnector';
import { misReportEndpoints } from '../../services/apis';

export default function MisReportDispatchManagement() {
	const [loadingWeekly, setLoadingWeekly] = useState(false);
	const [loadingDaily, setLoadingDaily] = useState(false);
	const [lastWeeklyRun, setLastWeeklyRun] = useState<string | null>(null);
	const [lastDailyRun, setLastDailyRun] = useState<string | null>(null);

	const handleSendWeeklyReport = async () => {
		setLoadingWeekly(true);
		const toastId = toast.loading('Generating & sending Weekly PDF MIS Report 1...');
		try {
			const res = await apiConnector(
				'GET',
				misReportEndpoints.TRIGGER_WEEKLY_REPORT_API
			);
			if (res?.data?.success) {
				toast.success('Weekly PDF MIS Report 1 dispatched successfully!', { id: toastId });
				setLastWeeklyRun(new Date().toLocaleTimeString());
			} else {
				toast.error('Failed to trigger Weekly MIS Report 1.', { id: toastId });
			}
		} catch (error: any) {
			console.error('Error dispatching weekly MIS report:', error);
			toast.error(error?.response?.data?.message || 'Error occurred while sending Weekly MIS report.', { id: toastId });
		} finally {
			setLoadingWeekly(false);
		}
	};

	const handleSendDailyExcelReport = async () => {
		setLoadingDaily(true);
		const toastId = toast.loading('Generating & sending Daily Excel MIS Report 2...');
		try {
			const res = await apiConnector(
				'GET',
				misReportEndpoints.TRIGGER_DAILY_EXCEL_REPORT_API
			);
			if (res?.data?.success) {
				toast.success('Daily Excel MIS Report 2 dispatched successfully!', { id: toastId });
				setLastDailyRun(new Date().toLocaleTimeString());
			} else {
				toast.error('Failed to trigger Daily Excel MIS Report 2.', { id: toastId });
			}
		} catch (error: any) {
			console.error('Error dispatching daily Excel MIS report:', error);
			toast.error(error?.response?.data?.message || 'Error occurred while sending Daily Excel MIS report.', { id: toastId });
		} finally {
			setLoadingDaily(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Top Banner */}
			<div className="relative bg-[#11236a] rounded-[24px] px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg overflow-hidden">
				<div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #6366f1 0%, transparent 60%)' }} />
				<div className="relative z-10">
					<div className="flex items-center gap-2 mb-1">
						<Mail className="w-4 h-4 text-indigo-300" />
						<p className="text-white/60 text-xs font-bold uppercase tracking-widest">Manual Testing Controls</p>
					</div>
					<h1 className="text-white text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
						MIS Report Email Dispatch
					</h1>
					<p className="text-white/50 text-xs mt-1 font-medium">Manually compile and send automated MIS reports via SMTP for testing & audit purposes.</p>
				</div>
			</div>

			{/* Cards Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

				{/* Card 1: Weekly PDF MIS Report 1 */}
				<div className="bg-white border border-zinc-200/80 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
								<FileText className="w-6 h-6" />
							</div>
							<span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
								PDF Report 1
							</span>
						</div>

						<div>
							<h3 className="text-lg font-extrabold text-zinc-900 tracking-tight">Weekly Lab MIS Analytics PDF</h3>
							<p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed">
								Generates high-resolution PDF summarizing weekly platform load, chamber utilization, reliability test cycle counts, standard safety runs, and NABL request outcomes.
							</p>
						</div>

						<div className="border border-zinc-150 bg-zinc-50/60 rounded-xl p-3 space-y-2 text-[11px]">
							<div className="flex items-center justify-between text-zinc-600">
								<span className="font-bold">Schedule Frequency:</span>
								<span className="font-semibold text-zinc-800">Every Monday @ 11:00 AM</span>
							</div>
							<div className="flex items-center justify-between text-zinc-600">
								<span className="font-bold">Target Roles:</span>
								<span className="font-semibold text-zinc-800">Head, CEO</span>
							</div>
							<div className="flex items-center justify-between text-zinc-600">
								<span className="font-bold">Format:</span>
								<span className="font-semibold text-zinc-800">Attached PDF File</span>
							</div>
							{lastWeeklyRun && (
								<div className="flex items-center justify-between text-emerald-700 pt-1 border-t border-zinc-200/80 font-bold">
									<span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Last Dispatched:</span>
									<span>{lastWeeklyRun}</span>
								</div>
							)}
						</div>
					</div>

					<div className="mt-6 pt-4 border-t border-zinc-100">
						<button
							onClick={handleSendWeeklyReport}
							disabled={loadingWeekly}
							className="w-full bg-[#11236a] hover:bg-[#1a3294] text-white font-extrabold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 border-none outline-none active:scale-[0.99]"
						>
							{loadingWeekly ? (
								<>
									<span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
									<span>Compiling PDF & Sending Email...</span>
								</>
							) : (
								<>
									<Send className="w-4 h-4" />
									<span>Send Weekly PDF MIS Report Now</span>
								</>
							)}
						</button>
					</div>
				</div>

				{/* Card 2: Daily Excel MIS Report 2 */}
				<div className="bg-white border border-zinc-200/80 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
								<FileSpreadsheet className="w-6 h-6" />
							</div>
							<span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
								Excel Report 2
							</span>
						</div>

						<div>
							<h3 className="text-lg font-extrabold text-zinc-900 tracking-tight">Daily Reliability Testing Excel</h3>
							<p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed">
								Compiles full Excel spreadsheet containing Master Reliability tracking sheet and individual daily checksheet sub-tabs (Wash/Spin Motor, Gearbox, PCB, etc.) for in-progress tests.
							</p>
						</div>

						<div className="border border-zinc-150 bg-zinc-50/60 rounded-xl p-3 space-y-2 text-[11px]">
							<div className="flex items-center justify-between text-zinc-600">
								<span className="font-bold">Schedule Frequency:</span>
								<span className="font-semibold text-zinc-800">Daily @ 11:00 AM</span>
							</div>
							<div className="flex items-center justify-between text-zinc-600">
								<span className="font-bold">Target Roles:</span>
								<span className="font-semibold text-zinc-800">Lab Manager, Head</span>
							</div>
							<div className="flex items-center justify-between text-zinc-600">
								<span className="font-bold">Format:</span>
								<span className="font-semibold text-zinc-800">Excel (.xlsx) Attachment</span>
							</div>
							{lastDailyRun && (
								<div className="flex items-center justify-between text-emerald-700 pt-1 border-t border-zinc-200/80 font-bold">
									<span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Last Dispatched:</span>
									<span>{lastDailyRun}</span>
								</div>
							)}
						</div>
					</div>

					<div className="mt-6 pt-4 border-t border-zinc-100">
						<button
							onClick={handleSendDailyExcelReport}
							disabled={loadingDaily}
							className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 border-none outline-none active:scale-[0.99]"
						>
							{loadingDaily ? (
								<>
									<span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
									<span>Generating Excel & Sending Email...</span>
								</>
							) : (
								<>
									<Send className="w-4 h-4" />
									<span>Send Daily Excel MIS Report Now</span>
								</>
							)}
						</button>
					</div>
				</div>

			</div>
		</div>
	);
}
