import DashboardLayout from '../layouts/DashboardLayout';
import { Users, CheckSquare, FileText, ChevronDown, ChevronRight } from 'lucide-react';

export default function CeoDashboard() {
	return (
		<DashboardLayout
			title="Dashboard"
			description=""
		>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="bg-white border border-zinc-200/50 rounded-[20px] p-5 shadow-sm flex flex-col justify-between">
					<div className="flex items-center gap-4">
						<div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
							<Users className="w-5 h-5" />
						</div>
						<div>
							<h4 className="text-2xl font-bold text-zinc-900 leading-tight">9</h4>
							<p className="text-xs text-zinc-400 font-medium">Active Visitor</p>
						</div>
					</div>
					<div className="border-t border-zinc-100 mt-4 pt-3 flex items-center justify-between text-xs text-zinc-450 hover:text-[#11236a] transition-all cursor-pointer">
						<span>View details</span>
						<ChevronRight className="w-3.5 h-3.5" />
					</div>
				</div>
				<div className="bg-white border border-zinc-200/50 rounded-[20px] p-5 shadow-sm flex flex-col justify-between">
					<div className="flex items-center gap-4">
						<div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
							<CheckSquare className="w-5 h-5" />
						</div>
						<div>
							<h4 className="text-2xl font-bold text-zinc-900 leading-tight">2,231</h4>
							<p className="text-xs text-zinc-400 font-medium">Click Events</p>
						</div>
					</div>
					<div className="border-t border-zinc-100 mt-4 pt-3 flex items-center justify-between text-xs text-zinc-450 hover:text-[#11236a] transition-all cursor-pointer">
						<span>View details</span>
						<ChevronRight className="w-3.5 h-3.5" />
					</div>
				</div>
				<div className="bg-white border border-zinc-200/50 rounded-[20px] p-5 shadow-sm flex flex-col justify-between">
					<div className="flex items-center gap-4">
						<div className="w-10 h-10 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
							<FileText className="w-5 h-5" />
						</div>
						<div>
							<h4 className="text-2xl font-bold text-zinc-900 leading-tight">2</h4>
							<p className="text-xs text-zinc-400 font-medium">Form Submissions</p>
						</div>
					</div>
					<div className="border-t border-zinc-100 mt-4 pt-3 flex items-center justify-between text-xs text-zinc-450 hover:text-[#11236a] transition-all cursor-pointer">
						<span>View details</span>
						<ChevronRight className="w-3.5 h-3.5" />
					</div>
				</div>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-bold text-zinc-800">Unique Visitor</h3>
						<button className="flex items-center gap-1.5 border border-zinc-200/60 rounded-lg px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer bg-white">
							<span>Last 3 month</span>
							<ChevronDown className="w-3 h-3" />
						</button>
					</div>
					<div className="flex items-baseline gap-2 mt-4">
						<span className="text-3xl font-extrabold text-zinc-900 tracking-tight">827</span>
						<span className="bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center gap-0.5">
							<span>↑</span>
							<span>3%</span>
						</span>
					</div>
					<div className="w-full h-44 mt-6">
						<svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
							<defs>
								<linearGradient id="capacityGradient" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="#11236a" stopOpacity="0.2" />
									<stop offset="100%" stopColor="#11236a" stopOpacity="0" />
								</linearGradient>
							</defs>
							<line x1="0" y1="37.5" x2="500" y2="37.5" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
							<line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
							<line x1="0" y1="112.5" x2="500" y2="112.5" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
							<path 
								d="M0,120 C100,120 120,90 180,95 C250,105 300,50 360,50 C420,50 460,110 500,110 L500,150 L0,150 Z" 
								fill="url(#capacityGradient)" 
							/>
							<path 
								d="M0,120 C100,120 120,90 180,95 C250,105 300,50 360,50 C420,50 460,110 500,110" 
								fill="none" 
								stroke="#11236a" 
								strokeWidth="2.5" 
								strokeLinecap="round"
							/>
							<circle cx="360" cy="50" r="4" fill="#ffffff" stroke="#11236a" strokeWidth="2.5" />
						</svg>
						<div className="flex justify-between text-[10px] text-zinc-400 font-medium px-1 mt-2">
							<span>Jul</span>
							<span>Aug</span>
							<span>Sep</span>
						</div>
					</div>
				</div>
				<div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-bold text-zinc-800">Page Views</h3>
						<button className="flex items-center gap-1.5 border border-zinc-200/60 rounded-lg px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer bg-white">
							<span>Last 3 month</span>
							<ChevronDown className="w-3 h-3" />
						</button>
					</div>
					<div className="flex items-baseline gap-2 mt-4">
						<span className="text-3xl font-extrabold text-zinc-900 tracking-tight">645</span>
						<span className="bg-rose-50 text-rose-600 border border-rose-100 rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center gap-0.5">
							<span>↓</span>
							<span>1.5%</span>
						</span>
					</div>
					<div className="w-full h-44 mt-6">
						<svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
							<defs>
								<linearGradient id="testsGradient" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="#d61a21" stopOpacity="0.2" />
									<stop offset="100%" stopColor="#d61a21" stopOpacity="0" />
								</linearGradient>
							</defs>
							<line x1="0" y1="37.5" x2="500" y2="37.5" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
							<line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
							<line x1="0" y1="112.5" x2="500" y2="112.5" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
							<path 
								d="M0,130 C120,130 180,130 250,110 C320,90 380,40 450,40 C480,40 490,90 500,90 L500,150 L0,150 Z" 
								fill="url(#testsGradient)" 
							/>
							<path 
								d="M0,130 C120,130 180,130 250,110 C320,90 380,40 450,40 C480,40 490,90 500,90" 
								fill="none" 
								stroke="#d61a21" 
								strokeWidth="2.5" 
								strokeLinecap="round"
							/>
							<circle cx="450" cy="40" r="4" fill="#ffffff" stroke="#d61a21" strokeWidth="2.5" />
						</svg>
						<div className="flex justify-between text-[10px] text-zinc-400 font-medium px-1 mt-2">
							<span>Jul</span>
							<span>Aug</span>
							<span>Sep</span>
						</div>
					</div>
				</div>
			</div>
			<div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm">
				<div className="flex items-center justify-between border-b border-zinc-100 pb-4">
					<div className="flex items-center gap-1">
						<button className="bg-zinc-100 text-zinc-800 text-xs font-bold py-1.5 px-4 rounded-lg border-none cursor-pointer">
							Pages
						</button>
						<button className="text-zinc-400 hover:text-zinc-700 text-xs font-bold py-1.5 px-4 rounded-lg border-none cursor-pointer bg-transparent">
							Entry Pages
						</button>
						<button className="text-zinc-400 hover:text-zinc-700 text-xs font-bold py-1.5 px-4 rounded-lg border-none cursor-pointer bg-transparent">
							Exit Pages
						</button>
					</div>
					<button className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer border-none bg-transparent">
						<span>This month</span>
						<ChevronDown className="w-3.5 h-3.5" />
					</button>
				</div>
				<div className="mt-6 space-y-5">
					<div className="grid grid-cols-12 items-center gap-4">
						<div className="col-span-3 text-xs font-bold text-zinc-800 truncate">
							/Home page
						</div>
						<div className="col-span-9">
							<div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
								<div className="bg-[#11236a] h-full rounded-full transition-all duration-500" style={{ width: '85%' }}></div>
							</div>
						</div>
					</div>
					<div className="grid grid-cols-12 items-center gap-4">
						<div className="col-span-3 text-xs font-bold text-zinc-800 truncate">
							/Pricing
						</div>
						<div className="col-span-9">
							<div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
								<div className="bg-[#11236a]/80 h-full rounded-full transition-all duration-500" style={{ width: '60%' }}></div>
							</div>
						</div>
					</div>
					<div className="grid grid-cols-12 items-center gap-4">
						<div className="col-span-3 text-xs font-bold text-zinc-800 truncate">
							/Contact
						</div>
						<div className="col-span-9">
							<div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
								<div className="bg-[#11236a]/60 h-full rounded-full transition-all duration-500" style={{ width: '45%' }}></div>
							</div>
						</div>
					</div>
					<div className="grid grid-cols-12 items-center gap-4">
						<div className="col-span-3 text-xs font-bold text-zinc-800 truncate">
							/News
						</div>
						<div className="col-span-9">
							<div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
								<div className="bg-[#11236a]/40 h-full rounded-full transition-all duration-500" style={{ width: '30%' }}></div>
							</div>
						</div>
					</div>
					<div className="grid grid-cols-12 items-center gap-4">
						<div className="col-span-3 text-xs font-bold text-zinc-800 truncate">
							/About
						</div>
						<div className="col-span-9">
							<div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
								<div className="bg-[#11236a]/20 h-full rounded-full transition-all duration-500" style={{ width: '25%' }}></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}