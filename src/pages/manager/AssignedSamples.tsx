import { useState } from 'react';
import { Search, ClipboardList, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import Pagination from '../../components/Pagination';

interface InspectionTask {
	id: string;
	brandName: string;
	modelNo: string;
	testMethodRef: string;
	sampleDescription: string;
	status: string; // 'PENDING' | 'PASSED' | 'FAILED'
	assignedDate: string;
	completedDate?: string;
	remarks?: string;
	checks?: {
		visualOk: boolean;
		insulationOk: boolean;
		thermalOk: boolean;
		gasketOk: boolean;
	};
}

interface AssignedSamplesProps {
	tasks: InspectionTask[];
	onCompleteInspection: (taskId: string, result: 'PASSED' | 'FAILED', remarks: string, checks: any) => void;
}

export default function AssignedSamples({ tasks, onCompleteInspection }: AssignedSamplesProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(5);

	// State to track if we are inspecting a specific sample
	const [activeInspectingTask, setActiveInspectingTask] = useState<InspectionTask | null>(null);

	// Checklist states for form
	const [visualOk, setVisualOk] = useState(true);
	const [insulationOk, setInsulationOk] = useState(true);
	const [thermalOk, setThermalOk] = useState(true);
	const [gasketOk, setGasketOk] = useState(true);
	const [inspectionRemarks, setInspectionRemarks] = useState('');
	const [recommendPass, setRecommendPass] = useState(true);

	const filteredTasks = tasks.filter(t => {
		return t.brandName.toLowerCase().includes(searchQuery.toLowerCase()) || 
			   t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
			   t.modelNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
			   t.testMethodRef.toLowerCase().includes(searchQuery.toLowerCase());
	});

	const maxPage = Math.ceil(filteredTasks.length / itemsPerPage);
	const activePage = maxPage > 0 ? Math.min(currentPage, maxPage) : 1;
	if (currentPage !== activePage) {
		setCurrentPage(activePage);
	}

	const startIndex = (activePage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

	const handleStartInspection = (task: InspectionTask) => {
		setActiveInspectingTask(task);
		// Reset form states
		setVisualOk(true);
		setInsulationOk(true);
		setThermalOk(true);
		setGasketOk(true);
		setInspectionRemarks('');
		setRecommendPass(true);
	};

	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!activeInspectingTask) return;

		onCompleteInspection(
			activeInspectingTask.id,
			recommendPass ? 'PASSED' : 'FAILED',
			inspectionRemarks || 'Inspection checklist successfully submitted.',
			{ visualOk, insulationOk, thermalOk, gasketOk }
		);

		setActiveInspectingTask(null);
	};

	// INSPECTION FORM SCREEN
	if (activeInspectingTask) {
		return (
			<div className="space-y-6">
				{/* Header row */}
				<div className="flex items-center gap-3">
					<button 
						onClick={() => setActiveInspectingTask(null)}
						className="w-9 h-9 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-800 hover:shadow-sm transition-all cursor-pointer outline-none border-none"
					>
						<ArrowLeft className="w-4 h-4 shrink-0" />
					</button>
					<div>
						<h3 className="text-base font-extrabold text-zinc-900 tracking-tight leading-none">Execute Inspection for {activeInspectingTask.id}</h3>
						<span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">{activeInspectingTask.brandName} • {activeInspectingTask.modelNo}</span>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Checklist Form */}
					<form onSubmit={handleFormSubmit} className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-6">
						<div>
							<h4 className="text-sm font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-100 pb-2">Mandatory NABL Verification Toggles</h4>
							<p className="text-xs text-zinc-500 font-medium mt-1">Please select yes or no changes for each calibration checkpoint.</p>
						</div>

						{/* Questions list */}
						<div className="space-y-4">
							{/* Q1 */}
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
								<div className="space-y-0.5">
									<h5 className="text-xs font-bold text-zinc-900">1. SMT Visual Structural integrity</h5>
									<p className="text-[10px] text-zinc-550 leading-relaxed font-semibold">Visual exterior seal, soldering alignments, and terminal connectors verify completed without physical damage?</p>
								</div>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={() => setVisualOk(true)}
										className={`text-xs font-bold px-4 py-1.5 rounded-lg border transition-all cursor-pointer active:scale-95 border-none ${
											visualOk 
												? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm' 
												: 'bg-zinc-50 hover:bg-zinc-100 text-zinc-500 border-zinc-200'
										}`}
									>
										Yes
									</button>
									<button
										type="button"
										onClick={() => setVisualOk(false)}
										className={`text-xs font-bold px-4 py-1.5 rounded-lg border transition-all cursor-pointer active:scale-95 border-none ${
											!visualOk 
												? 'bg-rose-50 text-rose-700 border-rose-300 shadow-sm' 
												: 'bg-zinc-50 hover:bg-zinc-100 text-zinc-500 border-zinc-200'
										}`}
									>
										No
									</button>
								</div>
							</div>

							{/* Q2 */}
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
								<div className="space-y-0.5">
									<h5 className="text-xs font-bold text-zinc-900">2. Electrical Insulation Resistance</h5>
									<p className="text-[10px] text-zinc-550 leading-relaxed font-semibold">Measured insulation resistances conform completely with baseline IEC standard thresholds?</p>
								</div>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={() => setInsulationOk(true)}
										className={`text-xs font-bold px-4 py-1.5 rounded-lg border transition-all cursor-pointer active:scale-95 border-none ${
											insulationOk 
												? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm' 
												: 'bg-zinc-50 hover:bg-zinc-100 text-zinc-500 border-zinc-200'
										}`}
									>
										Yes
									</button>
									<button
										type="button"
										onClick={() => setInsulationOk(false)}
										className={`text-xs font-bold px-4 py-1.5 rounded-lg border transition-all cursor-pointer active:scale-95 border-none ${
											!insulationOk 
												? 'bg-rose-50 text-rose-700 border-rose-300 shadow-sm' 
												: 'bg-zinc-50 hover:bg-zinc-100 text-zinc-500 border-zinc-200'
										}`}
									>
										No
									</button>
								</div>
							</div>

							{/* Q3 */}
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
								<div className="space-y-0.5">
									<h5 className="text-xs font-bold text-zinc-900">3. Thermal Shock Calibration</h5>
									<p className="text-[10px] text-zinc-550 leading-relaxed font-semibold">Thermal calibration levels measured within certified R&D chamber margins during peak cycles?</p>
								</div>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={() => setThermalOk(true)}
										className={`text-xs font-bold px-4 py-1.5 rounded-lg border transition-all cursor-pointer active:scale-95 border-none ${
											thermalOk 
												? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm' 
												: 'bg-zinc-50 hover:bg-zinc-100 text-zinc-500 border-zinc-200'
										}`}
									>
										Yes
									</button>
									<button
										type="button"
										onClick={() => setThermalOk(false)}
										className={`text-xs font-bold px-4 py-1.5 rounded-lg border transition-all cursor-pointer active:scale-95 border-none ${
											!thermalOk 
												? 'bg-rose-50 text-rose-700 border-rose-300 shadow-sm' 
												: 'bg-zinc-50 hover:bg-zinc-100 text-zinc-500 border-zinc-200'
										}`}
									>
										No
									</button>
								</div>
							</div>

							{/* Q4 */}
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
								<div className="space-y-0.5">
									<h5 className="text-xs font-bold text-zinc-900">4. Humidity Gasket Seal Verify</h5>
									<p className="text-[10px] text-zinc-550 leading-relaxed font-semibold">Moisture seals and elastomer ring gaskets certified leakproof during environment chamber test cycles?</p>
								</div>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={() => setGasketOk(true)}
										className={`text-xs font-bold px-4 py-1.5 rounded-lg border transition-all cursor-pointer active:scale-95 border-none ${
											gasketOk 
												? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm' 
												: 'bg-zinc-50 hover:bg-zinc-100 text-zinc-500 border-zinc-200'
										}`}
									>
										Yes
									</button>
									<button
										type="button"
										onClick={() => setGasketOk(false)}
										className={`text-xs font-bold px-4 py-1.5 rounded-lg border transition-all cursor-pointer active:scale-95 border-none ${
											!gasketOk 
												? 'bg-rose-50 text-rose-700 border-rose-300 shadow-sm' 
												: 'bg-zinc-50 hover:bg-zinc-100 text-zinc-500 border-zinc-200'
										}`}
									>
										No
									</button>
								</div>
							</div>
						</div>

						{/* Observations & Recommendation */}
						<div className="border-t border-zinc-100 pt-6 space-y-4">
							<div className="space-y-1.5">
								<label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Detailed Observations / Remarks</label>
								<textarea 
									value={inspectionRemarks}
									onChange={(e) => setInspectionRemarks(e.target.value)}
									placeholder="Write exact findings, measured telemetry values, or failures observed..."
									required
									className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-500 outline-none focus:bg-white focus:border-[#11236a] transition-all h-20 resize-none"
								/>
							</div>

							<div className="space-y-2">
								<label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Recommended Quality Ruling</label>
								<div className="flex gap-4">
									<label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-zinc-800">
										<input 
											type="radio" 
											name="outcome"
											checked={recommendPass}
											onChange={() => setRecommendPass(true)}
											className="accent-[#11236a] cursor-pointer"
										/>
										Conform / Pass Testing Standards
									</label>
									<label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-zinc-800">
										<input 
											type="radio" 
											name="outcome"
											checked={!recommendPass}
											onChange={() => setRecommendPass(false)}
											className="accent-[#11236a] cursor-pointer"
										/>
										Non-Conform / Fail Compliance
									</label>
								</div>
							</div>
						</div>

						{/* Buttons */}
						<div className="border-t border-zinc-100 pt-6 flex justify-end gap-3 shrink-0">
							<button 
								type="button"
								onClick={() => setActiveInspectingTask(null)}
								className="bg-transparent hover:bg-zinc-50 text-zinc-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-zinc-200 cursor-pointer active:scale-95 outline-none"
							>
								Cancel
							</button>
							<button 
								type="submit"
								className="bg-[#11236a] text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-[#0c1a52] transition-all cursor-pointer active:scale-[0.98] outline-none border-none"
							>
								Submit Inspection Checklist
							</button>
						</div>
					</form>

					{/* Task Reference details */}
					<div className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm space-y-4 h-fit">
						<h4 className="text-sm font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-100 pb-2">Task References</h4>
						<div className="text-xs space-y-3.5">
							<div>
								<span className="text-zinc-500 font-bold block uppercase text-[9px]">Sample specs description</span>
								<p className="text-zinc-700 font-semibold leading-relaxed mt-0.5">{activeInspectingTask.sampleDescription}</p>
							</div>
							<div>
								<span className="text-zinc-500 font-bold block uppercase text-[9px]">Inspection Standard Method</span>
								<p className="text-[#11236a] font-extrabold mt-0.5">{activeInspectingTask.testMethodRef}</p>
							</div>
							<div>
								<span className="text-zinc-500 font-bold block uppercase text-[9px]">Assigned Date</span>
								<p className="text-zinc-950 font-bold mt-0.5">{activeInspectingTask.assignedDate}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// ASSIGNED TASK LIST SCREEN
	return (
		<div className="space-y-6">
			{/* Toolbar */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
					<input 
						type="text" 
						placeholder="Search assigned inspections..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setCurrentPage(1);
						}}
						className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-500 outline-none focus:bg-white focus:border-[#11236a] transition-all"
					/>
				</div>
				<div className="text-xs text-zinc-500 font-medium bg-zinc-50 border border-zinc-200 px-3.5 py-2 rounded-xl">
					Duty Tasks: <strong className="text-zinc-800 font-extrabold">{tasks.length}</strong>
				</div>
			</div>

			{/* Task table list */}
			<div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden p-1">
				{paginatedTasks.length === 0 ? (
					<div className="text-center py-16">
						<ClipboardList className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
						<h4 className="text-sm font-bold text-zinc-800">No inspections assigned</h4>
						<p className="text-xs text-zinc-500 font-light mt-1">Select "Self Assignment" in Approved Request details to assign tasks here.</p>
					</div>
				) : (
					<div className="overflow-x-auto flex flex-col justify-between">
						<table className="w-full text-left border-collapse min-w-[700px]">
							<thead>
								<tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold text-[10px] uppercase tracking-wider">
									<th className="py-4 px-6">Task ID</th>
									<th className="py-4 px-6">Brand & Model</th>
									<th className="py-4 px-6">Method Standard</th>
									<th className="py-4 px-6">Assigned Date</th>
									<th className="py-4 px-6">Calibration Outcome</th>
									<th className="py-4 px-6 text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-750">
								{paginatedTasks.map((task) => {
									const isCompleted = task.status !== 'PENDING';
									return (
										<tr key={task.id} className="hover:bg-zinc-50/50 transition-all group">
											<td className="py-4 px-6 font-bold text-zinc-900">{task.id}</td>
											<td className="py-4 px-6 font-bold">
												<div>{task.brandName}</div>
												<span className="text-[10px] text-zinc-500 font-medium">{task.modelNo}</span>
											</td>
											<td className="py-4 px-6 text-[#11236a] font-extrabold">{task.testMethodRef}</td>
											<td className="py-4 px-6 text-zinc-600">{task.assignedDate}</td>
											<td className="py-4 px-6">
												<span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full uppercase tracking-wider flex items-center gap-1 w-fit ${
													task.status === 'PASSED' 
														? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
														: task.status === 'FAILED'
															? 'bg-rose-50 text-rose-600 border-rose-100'
															: 'bg-indigo-50 text-indigo-600 border-indigo-100 animate-pulse'
												}`}>
													{task.status === 'PENDING' ? (
														<>Active Duty</>
													) : (
														<>
															{task.status === 'PASSED' ? (
																<CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
															) : (
																<XCircle className="w-2.5 h-2.5 text-rose-600" />
															)}
															{task.status}
														</>
													)}
												</span>
											</td>
											<td className="py-4 px-6 text-right">
												{isCompleted ? (
													<span className="text-zinc-400 font-bold italic text-xs">Certified Done</span>
												) : (
													<button 
														onClick={() => handleStartInspection(task)}
														className="bg-[#11236a] text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg hover:bg-[#0c1a52] transition-all cursor-pointer border-none outline-none active:scale-[0.97]"
													>
														Inspect Now
													</button>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>

						<Pagination
							totalItems={filteredTasks.length}
							itemsPerPage={itemsPerPage}
							currentPage={currentPage}
							onPageChange={setCurrentPage}
							onItemsPerPageChange={(limit) => {
								setItemsPerPage(limit);
								setCurrentPage(1);
							}}
							itemNamePlural="assigned tasks"
						/>
					</div>
				)}
			</div>
		</div>
	);
}
