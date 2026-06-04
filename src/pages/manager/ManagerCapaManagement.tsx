import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus, X, ArrowLeft, AlertTriangle } from 'lucide-react';
import Pagination from '../../components/Pagination';
import CreateCapa from '../requester/CreateCapa';

interface CapaRecord {
	id: string;
	relatedRequest: string;
	productName: string;
	nonConformity: string;
	rootCause: string;
	correctiveAction: string;
	preventiveAction: string;
	targetedDate: string;
	status: string;
	owner: string;
	createdDate: string;
}

interface ManagerCapaManagementProps {
	capas: CapaRecord[];
	onAddCapa: (newCapa: any) => void;
	requests: any[];
}

export default function ManagerCapaManagement({ capas, onAddCapa, requests }: ManagerCapaManagementProps) {
	const navigate = useNavigate();
	const location = useLocation();

	const [capaView, setCapaView] = useState<'list' | 'new'>('list');

	// List filters state
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState('ALL');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(5);

	const [initialCapaInput, setInitialCapaInput] = useState<any>(null);

	useEffect(() => {
		if (location.state?.initialCapa) {
			const init = location.state.initialCapa;
			setInitialCapaInput(init);
			setCapaView('new');

			// Clear location.state so reloading or navigating doesn't reopen it
			navigate(location.pathname, { replace: true, state: {} });
		}
	}, [location.state, navigate, location.pathname]);

	// 1. NEW CAPA FORM VIEW
	if (capaView === 'new') {
		return (
			<CreateCapa
				requests={requests}
				onSubmit={(input: any) => {
					onAddCapa(input);
					setInitialCapaInput(null);
					setCapaView('list');
				}}
				setActiveTab={() => {
					setInitialCapaInput(null);
					setCapaView('list');
				}}
				initialInput={initialCapaInput}
			/>
		);
	}

	// 2. TABLE LIST VIEW (DEFAULT)
	const filteredCapas = capas.filter(c => {
		const matchesSearch = c.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
							  c.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
							  c.relatedRequest.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	const maxPage = Math.ceil(filteredCapas.length / itemsPerPage);
	const activePage = maxPage > 0 ? Math.min(currentPage, maxPage) : 1;
	if (currentPage !== activePage) {
		setCurrentPage(activePage);
	}

	const startIndex = (activePage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedCapas = filteredCapas.slice(startIndex, endIndex);

	return (
		<div className="space-y-6">
			{/* Top toolbar */}
			<div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex flex-col sm:flex-row gap-3 flex-1">
					<div className="relative flex-1 max-w-md">
						<Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-550" />
						<input 
							type="text" 
							placeholder="Search by product, CAPA ID, or request..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setCurrentPage(1);
							}}
							className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-500 outline-none focus:bg-white focus:border-[#11236a] transition-all"
						/>
						{searchQuery && (
							<button 
								onClick={() => {
									setSearchQuery('');
									setCurrentPage(1);
								}}
								className="absolute right-3 top-2.5 text-zinc-555 hover:text-red-655 bg-transparent border-none cursor-pointer outline-none"
							>
								<X className="w-4 h-4" />
							</button>
						)}
					</div>

					<select
						value={statusFilter}
						onChange={(e) => {
							setStatusFilter(e.target.value);
							setCurrentPage(1);
						}}
						className="bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 outline-none cursor-pointer hover:bg-zinc-50 transition-colors"
					>
						<option value="ALL">All Statuses</option>
						<option value="OPEN">Open Investigations</option>
						<option value="COMPLETED">Completed Actions</option>
					</select>
				</div>
			</div>

			{/* CAPA Table list */}
			<div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden p-1">
				{paginatedCapas.length === 0 ? (
					<div className="text-center py-16">
						<AlertTriangle className="w-10 h-10 text-zinc-350 mx-auto mb-3" />
						<h4 className="text-sm font-bold text-zinc-855">No CAPA plans registered</h4>
						<p className="text-xs text-zinc-655 font-light mt-1">Refine active parameters or launch a new report plan.</p>
					</div>
				) : (
					<div className="overflow-x-auto flex flex-col justify-between">
						<table className="w-full text-left border-collapse min-w-[700px]">
							<thead>
								<tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold text-[10px] uppercase tracking-wider">
									<th className="py-4 px-6">CAPA ID</th>
									<th className="py-4 px-6">Related Request</th>
									<th className="py-4 px-6">Product Affected</th>
									<th className="py-4 px-6">Non-Conformity Failure</th>
									<th className="py-4 px-6">Target Date</th>
									<th className="py-4 px-6">Status</th>
									<th className="py-4 px-6 text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-755">
								{paginatedCapas.map((capa) => (
									<tr key={capa.id} className="hover:bg-zinc-50/55 transition-all group">
										<td className="py-4 px-6 font-bold text-zinc-900">{capa.id}</td>
										<td className="py-4 px-6 font-bold text-[#11236a]">{capa.relatedRequest}</td>
										<td className="py-4 px-6 font-bold text-zinc-900">{capa.productName}</td>
										<td className="py-4 px-6 text-zinc-700 font-medium truncate max-w-xs">{capa.nonConformity}</td>
										<td className="py-4 px-6 text-zinc-700 font-medium">{capa.targetedDate}</td>
										<td className="py-4 px-6">
											<span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full uppercase tracking-wider ${
												capa.status === 'COMPLETED' 
													? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
													: 'bg-rose-50 text-rose-600 border-rose-100'
											}`}>
												{capa.status}
											</span>
										</td>
										<td className="py-4 px-6 text-right">
											<button 
												onClick={() => {
													navigate(`/manager/capa-management/${capa.id}`);
												}}
												className="text-xs font-bold text-[#11236a] hover:text-[#0c1a52] cursor-pointer group-hover:underline bg-transparent border-none outline-none"
											>
												Open Plan
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>

						<Pagination
							totalItems={filteredCapas.length}
							itemsPerPage={itemsPerPage}
							currentPage={currentPage}
							onPageChange={setCurrentPage}
							onItemsPerPageChange={(limit) => {
								setItemsPerPage(limit);
								setCurrentPage(1);
							}}
							itemNamePlural="CAPA reports"
						/>
					</div>
				)}
			</div>
		</div>
	);
}
