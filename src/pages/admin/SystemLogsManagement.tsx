import React, { useState, useEffect } from 'react';
import { ClipboardList, Search, Eye, RefreshCw, Loader2, CheckCircle, AlertCircle, Calendar, ShieldAlert } from 'lucide-react';
import Pagination from '../../components/Pagination';
import CustomSelect from '../../components/CustomSelect';
import systemLogService from '../../services/operations/systemLogService';
import type { SystemLogFilterParams } from '../../services/operations/systemLogService';

const entityOptions = [
	{ value: '', label: 'All Entities' },
	{ value: 'Department', label: 'Department' },
	{ value: 'User', label: 'User' },
	{ value: 'TestType', label: 'Test Type' },
	{ value: 'TestCategory', label: 'Test Category' },
	{ value: 'TestProtocol', label: 'Test Protocol' },
	{ value: 'ProductPart', label: 'Product / Part Name' },
	{ value: 'SupplierCustomer', label: 'Supplier / Customer' },
	{ value: 'TestingEquipment', label: 'R&D Testing Equipment' }
];

const actionOptions = [
	{ value: '', label: 'All Actions' },
	{ value: 'CREATE', label: 'CREATE' },
	{ value: 'UPDATE', label: 'UPDATE' },
	{ value: 'DELETE', label: 'DELETE' }
];

const sortByOptions = [
	{ value: 'createdAt', label: 'Timestamp' },
	{ value: 'performedBy', label: 'User (Operator)' },
	{ value: 'entity', label: 'Entity Type' },
	{ value: 'action', label: 'Action' }
];

const sortOrderOptions = [
	{ value: 'desc', label: 'Newest First' },
	{ value: 'asc', label: 'Oldest First' }
];

interface SystemLog {
	id: number;
	action: 'CREATE' | 'UPDATE' | 'DELETE';
	entity: string;
	entityId: string;
	details: string;
	performedBy: string;
	createdAt: string;
}

export default function SystemLogsManagement() {
	const [logs, setLogs] = useState<SystemLog[]>([]);
	const [totalLogs, setTotalLogs] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Filter state
	const [search, setSearch] = useState('');
	const [entity, setEntity] = useState('');
	const [action, setAction] = useState('');
	const [sortBy, setSortBy] = useState('createdAt');
	const [sortOrder, setSortOrder] = useState('desc');

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);

	// Detail Modal state
	const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

	// Stats counters based on current filters (excluding pagination)
	const [stats, setStats] = useState({
		total: 0,
		creates: 0,
		updates: 0,
		deletes: 0
	});

	const fetchLogs = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const filterParams: SystemLogFilterParams = {
				page: currentPage,
				limit: itemsPerPage,
				search: search.trim() || undefined,
				entity: entity || undefined,
				action: action || undefined,
				sortBy,
				sortOrder
			};

			const result = await systemLogService.getSystemLogs(filterParams)();
			if (result && result.success) {
				setLogs(result.data?.logs || []);
				setTotalLogs(result.data?.total || 0);

				// Set stats from data if returned or fallback
				setStats({
					total: result.data?.total || 0,
					creates: result.data?.stats?.CREATE || 0,
					updates: result.data?.stats?.UPDATE || 0,
					deletes: result.data?.stats?.DELETE || 0
				});
			} else {
				throw new Error(result?.message || 'Failed to retrieve logs');
			}
		} catch (err) {
			console.error('Error loading logs:', err);
			setError(err instanceof Error ? err.message : 'Connection error fetching logs registry.');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchLogs();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage, itemsPerPage, entity, action, sortBy, sortOrder]);

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setCurrentPage(1);
		fetchLogs();
	};

	const formatDetails = (detailsStr: string) => {
		try {
			const parsed = JSON.parse(detailsStr);
			return JSON.stringify(parsed, null, 2);
		} catch (e) {
			return detailsStr;
		}
	};

	const renderChangeDescription = (log: SystemLog) => {
		let detailsObj: any = null;
		try {
			detailsObj = JSON.parse(log.details);
		} catch (e) {
			return <p className="text-xs text-zinc-750 font-medium">{log.details}</p>;
		}

		if (log.action === 'CREATE') {
			const data = detailsObj.new || detailsObj;
			const dataEntries = Object.entries(data);
			if (dataEntries.length === 0) {
				return (
					<p className="text-xs text-zinc-750 font-semibold">
						Created <span className="text-emerald-700 font-extrabold">{log.entity}</span> entry (ID: {log.entityId || 'N/A'}) successfully.
					</p>
				);
			}

			return (
				<div className="space-y-2">
					<p className="text-xs text-zinc-750 font-semibold">
						Created new <span className="text-[#11236a] font-extrabold">{log.entity}</span> with the following parameters:
					</p>
					<ul className="list-none space-y-1.5 bg-white p-3.5 rounded-xl border border-zinc-150 text-xs">
						{dataEntries.map(([key, val]) => (
							<li key={key} className="text-zinc-650 flex items-baseline gap-1.5">
								<span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
								<span className="text-zinc-750 font-extrabold capitalize min-w-[120px] inline-block">{key.replace(/([A-Z])/g, ' $1')}:</span>
								<span className="font-semibold text-zinc-900">{String(val)}</span>
							</li>
						))}
					</ul>
				</div>
			);
		}

		if (log.action === 'DELETE') {
			const data = detailsObj.old || detailsObj;
			const getEntityName = (d: any) => {
				if (!d) return '';
				return d.name || d.username || d.partNo || '';
			};
			const nameVal = getEntityName(data);

			return (
				<div className="space-y-2">
					<p className="text-xs text-zinc-750 font-semibold">
						Deleted <span className="text-rose-700 font-extrabold">{log.entity}</span> entry:
					</p>
					<div className="bg-white p-3.5 rounded-xl border border-zinc-150 text-xs">
						<p className="text-zinc-750 font-semibold">
							Entry Name: <strong className="text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded font-extrabold ml-1">{nameVal || 'Unknown / N/A'}</strong>
						</p>
					</div>
				</div>
			);
		}

		if (log.action === 'UPDATE') {
			const isOldNewStructure = detailsObj.old !== undefined && detailsObj.new !== undefined;
			
			if (isOldNewStructure) {
				const oldData = detailsObj.old || {};
				const newData = detailsObj.new || {};
				
				const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]));
				const changes = allKeys.filter(k => String(oldData[k]) !== String(newData[k]));

				if (changes.length === 0) {
					return <p className="text-xs text-zinc-750 font-semibold">Updated properties without altering audited values.</p>;
				}

				return (
					<div className="space-y-2.5">
						<p className="text-xs text-zinc-750 font-semibold">
							Modified properties on <span className="text-amber-700 font-extrabold">{log.entity}</span>:
						</p>
						<div className="bg-white p-4 rounded-xl border border-zinc-150 space-y-3">
							{changes.map((key) => (
								<div key={key} className="text-xs text-zinc-750 flex flex-col sm:flex-row sm:items-center gap-1.5">
									<span className="font-extrabold text-zinc-800 capitalize min-w-[120px] inline-block">{key.replace(/([A-Z])/g, ' $1')}:</span>
									<div className="flex items-center gap-1.5 flex-wrap">
										<span>changed from</span>
										<span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 rounded font-semibold line-through">
											{String(oldData[key] !== undefined && oldData[key] !== null ? oldData[key] : 'None')}
										</span>
										<span>to</span>
										<span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded font-extrabold">
											{String(newData[key] !== undefined && newData[key] !== null ? newData[key] : 'None')}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				);
			}

			const entries = Object.entries(detailsObj);
			if (entries.length === 0) {
				return (
					<p className="text-xs text-zinc-750 font-semibold">
						Modified properties on <span className="text-amber-700 font-extrabold">{log.entity}</span> (ID: {log.entityId || 'N/A'}) successfully.
					</p>
				);
			}

			return (
				<div className="space-y-2">
					<p className="text-xs text-zinc-750 font-semibold">
						Modified properties on <span className="text-amber-700 font-extrabold">{log.entity}</span>:
					</p>
					<div className="bg-white p-4 rounded-xl border border-zinc-150 space-y-3">
						{entries.map(([key, val]) => (
							<div key={key} className="text-xs text-zinc-750 flex flex-col sm:flex-row sm:items-center gap-1.5">
								<span className="font-extrabold text-zinc-800 capitalize min-w-[120px] inline-block">{key.replace(/([A-Z])/g, ' $1')}:</span>
								<div className="flex items-center gap-1.5 flex-wrap">
									<span>changed to</span>
									<span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded font-extrabold">
										{String(val)}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			);
		}

		return null;
	};

	const getLogSummary = (log: SystemLog): string => {
		let detailsObj: any = null;
		try {
			detailsObj = JSON.parse(log.details);
		} catch (e) {
			return log.details;
		}

		const getEntityName = (data: any) => {
			if (!data) return '';
			return data.name || data.username || data.partNo || '';
		};

		if (log.action === 'CREATE') {
			const data = detailsObj.new || detailsObj;
			const nameVal = getEntityName(data);
			return `Created new ${log.entity}${nameVal ? ` "${nameVal}"` : ''}`;
		}

		if (log.action === 'DELETE') {
			const data = detailsObj.old || detailsObj;
			const nameVal = getEntityName(data);
			return `Deleted ${log.entity}${nameVal ? ` "${nameVal}"` : ''}`;
		}

		if (log.action === 'UPDATE') {
			const oldData = detailsObj.old;
			const newData = detailsObj.new;

			if (oldData && newData) {
				const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]));
				const changes = allKeys.filter(k => String(oldData[k]) !== String(newData[k]));

				if (changes.length > 0) {
					return `Edited ${log.entity} (${changes.map(k => `${k} from "${oldData[k] !== undefined && oldData[k] !== null ? oldData[k] : ''}" to "${newData[k] !== undefined && newData[k] !== null ? newData[k] : ''}"`).join(', ')})`;
				}
			}

			const oldName = getEntityName(detailsObj.old);
			const newName = getEntityName(detailsObj.new || detailsObj);
			if (oldName && newName && oldName !== newName) {
				return `Edited name from "${oldName}" to "${newName}"`;
			}
			return `Edited properties on ${log.entity}`;
		}

		return '';
	};

	return (
		<div className="space-y-6">
			{error && (
				<div className="bg-rose-50 border border-rose-250 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in shadow-sm">
					<AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
					<span>{error}</span>
				</div>
			)}

			{/* Stats Panel */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{[
					{ label: 'Total Operations Logs', value: stats.total, color: 'text-[#11236a]', bg: 'bg-[#11236a]/5 border-zinc-200/50' },
					{ label: 'Creation Actions', value: stats.creates, color: 'text-emerald-700', bg: 'bg-emerald-50/50 border-emerald-100' },
					{ label: 'Update Actions', value: stats.updates, color: 'text-amber-700', bg: 'bg-amber-50/50 border-amber-100' },
					{ label: 'Deletion Actions', value: stats.deletes, color: 'text-rose-700', bg: 'bg-rose-50/50 border-rose-100' },
				].map(({ label, value, color, bg }) => (
					<div key={label} className={`bg-white border rounded-2xl p-4 shadow-sm ${bg}`}>
						<p className="text-[10px] text-zinc-700 font-bold uppercase tracking-wider">{label}</p>
						<h3 className={`text-2xl font-extrabold mt-1 ${color}`}>
							{isLoading ? (
								<Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
							) : (
								value
							)}
						</h3>
					</div>
				))}
			</div>

			{/* Filters Panel */}
			<div className="bg-white border border-zinc-200/60 rounded-[24px] p-5 shadow-sm space-y-4">
				<form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
					<div className="relative flex-1">
						<span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
							<Search className="w-4 h-4" />
						</span>
						<input
							type="text"
							placeholder="Search by operator or entity ID..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full bg-[#f8fafc] border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-800 placeholder-zinc-550 outline-none focus:border-[#11236a] transition-all font-light"
						/>
					</div>
					<div className="flex flex-wrap gap-3">
						<button
							type="submit"
							className="bg-[#11236a] text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer hover:bg-[#0c1a52] transition-all border-none outline-none"
						>
							Search
						</button>
						<button
							type="button"
							onClick={() => {
								setSearch('');
								setEntity('');
								setAction('');
								setSortBy('createdAt');
								setSortOrder('desc');
								setCurrentPage(1);
								setTimeout(() => fetchLogs(), 0);
							}}
							className="bg-zinc-150 hover:bg-zinc-200 text-zinc-750 text-xs font-bold px-4 py-2.5 rounded-xl transition-all border-none outline-none cursor-pointer flex items-center gap-1.5"
						>
							<RefreshCw className="w-3.5 h-3.5" /> Reset
						</button>
					</div>
				</form>

				<div className="border-t border-zinc-100 pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
					<div>
						<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide mb-1.5">Entity Type</label>
						<CustomSelect
							value={entity}
							onChange={(val) => { setEntity(val); setCurrentPage(1); }}
							options={entityOptions}
							placeholder="All Entities"
						/>
					</div>

					<div>
						<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide mb-1.5">Action Type</label>
						<CustomSelect
							value={action}
							onChange={(val) => { setAction(val); setCurrentPage(1); }}
							options={actionOptions}
							placeholder="All Actions"
						/>
					</div>

					<div>
						<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide mb-1.5">Sort By</label>
						<CustomSelect
							value={sortBy}
							onChange={(val) => setSortBy(val)}
							options={sortByOptions}
							placeholder="Timestamp"
						/>
					</div>

					<div>
						<label className="block text-[10px] text-zinc-700 font-bold uppercase tracking-wide mb-1.5">Sort Order</label>
						<CustomSelect
							value={sortOrder}
							onChange={(val) => setSortOrder(val)}
							options={sortOrderOptions}
							placeholder="Newest First"
						/>
					</div>
				</div>
			</div>

			{/* Logs Table */}
			<div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden">
				{isLoading ? (
					<div className="py-20 flex flex-col items-center justify-center gap-3">
						<Loader2 className="w-8 h-8 text-[#11236a] animate-spin" />
						<p className="text-xs text-zinc-600 font-light">Retrieving audit log entries from Dixon DB...</p>
					</div>
				) : (
					<div className="overflow-x-auto flex flex-col justify-between">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 font-bold text-[10px] uppercase tracking-wider">
									<th className="py-4 px-6">Timestamp</th>
									<th className="py-4 px-6">Action</th>
									<th className="py-4 px-6">Description</th>
									<th className="py-4 px-6">Performed By</th>
									<th className="py-4 px-6 text-right">Payload</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-700">
								{logs.length === 0 ? (
									<tr>
										<td
											colSpan={5}
											className="py-12 text-center text-zinc-500 font-light"
										>
											No matching administrative audit logs found in registry database.
										</td>
									</tr>
								) : (
									logs.map((log) => {
										let badgeClass = '';
										if (log.action === 'CREATE') {
											badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
										} else if (log.action === 'UPDATE') {
											badgeClass = 'bg-amber-50 text-amber-700 border-amber-100';
										} else if (log.action === 'DELETE') {
											badgeClass = 'bg-rose-50 text-rose-700 border-rose-100';
										}

										return (
											<tr key={log.id} className="hover:bg-zinc-50/50 transition-colors">
												<td className="py-4 px-6 text-zinc-500 font-normal whitespace-nowrap">
													<div className="flex items-center gap-1.5">
														<Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
														<span>{new Date(log.createdAt).toLocaleString()}</span>
													</div>
												</td>
												<td className="py-4 px-6">
													<span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}>
														{log.action}
													</span>
												</td>
												<td className="py-4 px-6 text-zinc-800 font-semibold max-w-xs md:max-w-md truncate" title={getLogSummary(log)}>
													{getLogSummary(log)}
												</td>
												<td className="py-4 px-6">
													<span className="font-semibold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-full">
														{log.performedBy}
													</span>
												</td>
												<td className="py-4 px-6 text-right">
													<button
														onClick={() => setSelectedLog(log)}
														className="bg-zinc-100 hover:bg-zinc-200 text-[#11236a] p-1.5 rounded-lg border-none outline-none cursor-pointer transition-all inline-flex items-center justify-center gap-1 text-[11px] font-bold"
														title="View Payload Details"
													>
														<Eye className="w-3.5 h-3.5" /> View
													</button>
												</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>

						<Pagination
							totalItems={totalLogs}
							itemsPerPage={itemsPerPage}
							currentPage={currentPage}
							onPageChange={setCurrentPage}
							onItemsPerPageChange={(limit) => {
								setItemsPerPage(limit);
								setCurrentPage(1);
							}}
							itemNamePlural="audit logs"
						/>
					</div>
				)}
			</div>

			{/* Details Modal */}
			{selectedLog && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-white border border-zinc-200 rounded-3xl max-w-2xl w-full shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[85vh]">
						<button
							onClick={() => setSelectedLog(null)}
							className="absolute top-4 right-4 w-7 h-7 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center text-zinc-650 hover:text-red-600 transition-all cursor-pointer outline-none border-none"
						>
							✕
						</button>
						
						<div className="flex items-center gap-3 border-b border-zinc-100 pb-4 shrink-0">
							<div className="w-10 h-10 bg-[#11236a]/5 rounded-xl flex items-center justify-center shrink-0">
								<ClipboardList className="w-5 h-5 text-[#11236a]" />
							</div>
							<div>
								<h3 className="text-base font-bold text-zinc-900">Audit Log Details</h3>
								<p className="text-[10px] text-zinc-500 font-medium">Log ID: #{selectedLog.id}</p>
							</div>
						</div>

						<div className="mt-4 space-y-4 flex-grow overflow-y-auto pr-1">
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#f8fafc] p-4 rounded-2xl border border-zinc-150 text-xs">
								<div>
									<p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Operation</p>
									<span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-1 ${
										selectedLog.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
										selectedLog.action === 'UPDATE' ? 'bg-amber-50 text-amber-700 border-amber-100' :
										'bg-rose-50 text-rose-700 border-rose-100'
									}`}>
										{selectedLog.action}
									</span>
								</div>
								<div>
									<p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Entity Type</p>
									<p className="font-extrabold text-[#11236a] mt-1">{selectedLog.entity}</p>
								</div>
								<div>
									<p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Entity ID</p>
									<p className="font-mono text-zinc-700 mt-1">{selectedLog.entityId || 'N/A'}</p>
								</div>
								<div>
									<p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Operator</p>
									<p className="font-bold text-zinc-800 mt-1">{selectedLog.performedBy}</p>
								</div>
							</div>

							<div>
								<p className="text-[10px] text-zinc-550 font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5">
									<ShieldAlert className="w-3.5 h-3.5 text-zinc-450 shrink-0" />
									Audited Changes
								</p>
								<div className="bg-[#f8fafc] border border-zinc-200 rounded-2xl p-4.5">
									{renderChangeDescription(selectedLog)}
								</div>
							</div>

							<div className="flex items-center gap-1.5 text-[10px] text-zinc-450 font-semibold italic bg-zinc-50 px-3.5 py-2 rounded-xl">
								<span>Operation completed and recorded at:</span>
								<span>{new Date(selectedLog.createdAt).toString()}</span>
							</div>
						</div>

						<div className="flex justify-end pt-4 border-t border-zinc-100 shrink-0">
							<button
								type="button"
								onClick={() => setSelectedLog(null)}
								className="px-5 py-2.5 bg-[#11236a] hover:bg-[#0c1a52] text-white rounded-xl text-xs font-bold transition-all cursor-pointer outline-none border-none shadow-sm"
							>
								Close Details
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
