import { useState } from 'react';
import { ArrowLeft, User, Shield, Info, CheckCircle, XCircle } from 'lucide-react';

interface ApprovedRequest {
	id: string;
	customerNameAddress: string;
	sampleDescription: string;
	modelNo: string;
	brandName: string;
	sampleQty: number;
	testMethodRef: string;
	requesterName: string;
	status: string;
	approvedDate: string;
	engineerId?: string;
	engineerName?: string;
	inspectionResult?: string;
	inspectionRemarks?: string;
	inspectionDate?: string;
}

interface ApprovedRequestDetailsProps {
	request: ApprovedRequest | null;
	onBack: () => void;
	onAssignEngineer: (requestId: string, engineerId: string, engineerName: string) => void;
	onSimulateInspectionCompletion: (requestId: string, result: 'PASSED' | 'FAILED', remarks: string) => void;
}

const DUMMY_ENGINEERS = [
	{ id: 'ENG-001', name: 'Dr. Amit Patel (Vibration Spec)' },
	{ id: 'ENG-002', name: 'Er. Rajesh Kumar (Thermal Stress)' },
	{ id: 'ENG-003', name: 'Er. Vikram Singh (Environmental)' },
	{ id: 'MGR-001', name: 'Lab Manager (Self Assignment)' },
];

export default function ApprovedRequestDetails({ 
	request, 
	onBack, 
	onAssignEngineer, 
	onSimulateInspectionCompletion 
}: ApprovedRequestDetailsProps) {
	const [selectedEngineerId, setSelectedEngineerId] = useState('');
	const [simulatedRemarks, setSimulatedRemarks] = useState('');

	if (!request) {
		return (
			<div className="bg-white border border-zinc-200 rounded-3xl p-8 text-center">
				<p className="text-zinc-500 text-sm font-medium">No request selected.</p>
				<button onClick={onBack} className="mt-4 text-[#11236a] text-xs font-bold hover:underline">
					Go Back
				</button>
			</div>
		);
	}

	const handleAssignSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedEngineerId) return;
		const engineer = DUMMY_ENGINEERS.find(eng => eng.id === selectedEngineerId);
		if (engineer) {
			onAssignEngineer(request.id, engineer.id, engineer.name);
		}
	};

	const isAllocated = !!request.engineerId;
	const isCompleted = !!request.inspectionResult;

	return (
		<div className="space-y-6">
			{/* Back bar */}
			<div className="flex items-center gap-3">
				<button 
					onClick={onBack}
					className="w-9 h-9 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-555 hover:text-zinc-800 hover:shadow-sm transition-all cursor-pointer outline-none"
				>
					<ArrowLeft className="w-4 h-4 shrink-0" />
				</button>
				<div>
					<h3 className="text-base font-extrabold text-zinc-900 tracking-tight leading-none">{request.id} Allocation Details</h3>
					<span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">{request.brandName} • {request.modelNo}</span>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Details Panel */}
				<div className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-6">
					<div>
						<h4 className="text-sm font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-100 pb-2">Sample Testing Metadata</h4>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
							<div>
								<span className="text-zinc-500 font-bold block uppercase text-[9px] tracking-wider">Brand Name</span>
								<p className="text-zinc-900 font-extrabold mt-0.5">{request.brandName}</p>
							</div>
							<div>
								<span className="text-zinc-500 font-bold block uppercase text-[9px] tracking-wider">Model Number</span>
								<p className="text-zinc-900 font-extrabold mt-0.5">{request.modelNo}</p>
							</div>
							<div>
								<span className="text-zinc-500 font-bold block uppercase text-[9px] tracking-wider">Sample Quantity</span>
								<p className="text-zinc-900 font-extrabold mt-0.5">{request.sampleQty} units</p>
							</div>
							<div>
								<span className="text-zinc-500 font-bold block uppercase text-[9px] tracking-wider">Approved Date</span>
								<p className="text-zinc-900 font-bold mt-0.5">{request.approvedDate}</p>
							</div>
							<div className="sm:col-span-2">
								<span className="text-zinc-500 font-bold block uppercase text-[9px] tracking-wider">Testing Standard Reference</span>
								<p className="text-[#11236a] font-extrabold mt-0.5">{request.testMethodRef}</p>
							</div>
							<div className="sm:col-span-2">
								<span className="text-zinc-500 font-bold block uppercase text-[9px] tracking-wider">Technical Requirements</span>
								<p className="text-zinc-800 font-medium leading-relaxed bg-[#f8fafc] p-3 rounded-xl border border-zinc-150 mt-1">
									{request.sampleDescription}
								</p>
							</div>
						</div>
					</div>

					<div>
						<h4 className="text-sm font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-100 pb-2">Company Logistics</h4>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
							<div>
								<span className="text-zinc-500 font-bold block uppercase text-[9px] tracking-wider">Requester</span>
								<p className="text-zinc-900 font-bold mt-0.5">{request.requesterName}</p>
							</div>
							<div>
								<span className="text-zinc-500 font-bold block uppercase text-[9px] tracking-wider">Customer / Client details</span>
								<p className="text-zinc-850 font-medium leading-relaxed mt-0.5">{request.customerNameAddress}</p>
							</div>
						</div>
					</div>
				</div>

				{/* Assignment and Results Actions Panel */}
				<div className="space-y-6">
					{/* Assignment Box */}
					<div className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm">
						<h4 className="text-sm font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-100 pb-2 flex items-center gap-1.5">
							<User className="w-4 h-4 text-[#11236a]" /> Staff Assignment
						</h4>

						{isAllocated ? (
							<div className="mt-4 space-y-4">
								<div className="bg-blue-50 border border-blue-100 text-blue-900 rounded-2xl p-4 text-xs font-semibold">
									<p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider leading-none mb-1">Assigned Inspector/Engineer</p>
									<p className="font-extrabold text-zinc-900">{request.engineerName}</p>
									<span className="inline-block text-[8px] font-bold px-1.5 py-0.5 bg-[#11236a]/10 text-[#11236a] rounded mt-2 uppercase tracking-wide">
										{request.engineerId}
									</span>
								</div>
								{!isCompleted && (
									<p className="text-[10px] text-zinc-500 leading-relaxed italic">
										Inspection currently active in testing bay. Awaiting calibration logs.
									</p>
								)}
							</div>
						) : (
							<form onSubmit={handleAssignSubmit} className="mt-4 space-y-4">
								<div className="space-y-2">
									<label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Select Duty Engineer</label>
									<select 
										value={selectedEngineerId}
										onChange={(e) => setSelectedEngineerId(e.target.value)}
										required
										className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-700 outline-none cursor-pointer focus:bg-white focus:border-[#11236a] hover:bg-zinc-50 transition-colors"
									>
										<option value="">-- Select Specialist --</option>
										{DUMMY_ENGINEERS.map(eng => (
											<option key={eng.id} value={eng.id}>{eng.name}</option>
										))}
									</select>
								</div>
								<button 
									type="submit"
									className="w-full bg-[#11236a] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#0c1a52] transition-all border-none outline-none cursor-pointer active:scale-[0.98]"
								>
									Allocate testing Plan
								</button>
							</form>
						)}
					</div>

					{/* Simulation & Results Box */}
					<div className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm">
						<h4 className="text-sm font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-100 pb-2 flex items-center gap-1.5">
							<Shield className="w-4 h-4 text-emerald-600" /> Inspection Results
						</h4>

						{isCompleted ? (
							<div className="mt-4 space-y-4">
								<div className={`border rounded-2xl p-4 text-xs font-bold ${
									request.inspectionResult === 'PASSED' 
										? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
										: 'bg-rose-50 border-rose-100 text-rose-800'
								}`}>
									<div className="flex items-center gap-1.5 text-xs">
										{request.inspectionResult === 'PASSED' ? (
											<CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
										) : (
											<XCircle className="w-4 h-4 shrink-0 text-rose-600" />
										)}
										<span className="uppercase tracking-widest text-[11px]">Inspection: {request.inspectionResult}</span>
									</div>
									<div className="border-t border-zinc-200/20 mt-3 pt-2 text-[10px] text-zinc-650 font-semibold space-y-1">
										<p>Certified Date: <strong>{request.inspectionDate}</strong></p>
										<p>Engineer Remarks: <em className="text-zinc-800">"{request.inspectionRemarks}"</em></p>
									</div>
								</div>
							</div>
						) : isAllocated ? (
							<div className="mt-4 space-y-4">
								<div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3.5 flex items-center gap-2">
									<Info className="w-4 h-4 text-indigo-500 shrink-0" />
									<span className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
										Simulate completion (in a real scenario, the testing engineer logs these results via their terminal portal).
									</span>
								</div>

								<div className="space-y-3">
									<div className="space-y-1.5">
										<label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Simulator Remarks</label>
										<textarea 
											value={simulatedRemarks}
											onChange={(e) => setSimulatedRemarks(e.target.value)}
											placeholder="Enter mock calibration logs or values..."
											className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-500 outline-none focus:bg-white focus:border-[#11236a] transition-all h-16 resize-none"
										/>
									</div>

									<div className="flex gap-2">
										<button 
											onClick={() => onSimulateInspectionCompletion(request.id, 'PASSED', simulatedRemarks || 'All parameter test checks conform completely to standards.')}
											className="flex-1 bg-emerald-600 text-white text-[11px] font-bold py-2 rounded-lg hover:bg-emerald-700 transition-all border-none outline-none cursor-pointer active:scale-95 text-center"
										>
											Certify Pass
										</button>
										<button 
											onClick={() => onSimulateInspectionCompletion(request.id, 'FAILED', simulatedRemarks || 'Moisture ingress observed at peak load thresholds.')}
											className="flex-1 bg-rose-600 text-white text-[11px] font-bold py-2 rounded-lg hover:bg-rose-700 transition-all border-none outline-none cursor-pointer active:scale-95 text-center"
										>
											Certify Fail
										</button>
									</div>
								</div>
							</div>
						) : (
							<div className="mt-4 bg-zinc-50 border border-zinc-150 rounded-2xl p-4 text-center text-xs font-semibold text-zinc-500">
								Awaiting engineer assignment to begin calibration.
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
