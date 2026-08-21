interface PaginationProps {
	totalItems: number;
	itemsPerPage: number;
	currentPage: number;
	onPageChange: (page: number) => void;
	onItemsPerPageChange: (limit: number) => void;
	itemNamePlural?: string;
}

export default function Pagination({
	totalItems,
	itemsPerPage,
	currentPage,
	onPageChange,
	onItemsPerPageChange,
	itemNamePlural = 'records'
}: PaginationProps) {
	const totalPages = Math.ceil(totalItems / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;

	const getPaginationText = () => {
		if (totalItems <= itemsPerPage) return `Showing all ${totalItems} ${totalItems === 1 ? itemNamePlural.replace(/s$/, '') : itemNamePlural}`;
		return `Showing ${startIndex + 1} to ${Math.min(endIndex, totalItems)} of ${totalItems} ${itemNamePlural}`;
	};

	const getPageNumbers = (): (number | string)[] => {
		const pages: (number | string)[] = [];
		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
		} else {
			pages.push(1);
			if (currentPage > 3) {
				pages.push('...');
			}

			const start = Math.max(2, currentPage - 1);
			const end = Math.min(totalPages - 1, currentPage + 1);
			for (let i = start; i <= end; i++) {
				if (!pages.includes(i)) {
					pages.push(i);
				}
			}
			if (currentPage < totalPages - 2) {
				pages.push('...');
			}
			pages.push(totalPages);
		}
		return pages;
	};

	if (totalItems === 0) return null;

	return (
		<div className="bg-zinc-50 border-t border-zinc-100 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
			<div className="flex items-center gap-4 flex-wrap">
				<div className="flex items-center gap-2">
					<span className="text-xs text-zinc-500 font-medium whitespace-nowrap">Rows per page:</span>
					<select
						value={itemsPerPage}
						onChange={(e) => {
							onItemsPerPageChange(Number(e.target.value));
						}}
						className="bg-white border border-zinc-200 rounded-lg text-xs font-semibold px-2 py-1 outline-none text-zinc-700 focus:border-[#11236a] cursor-pointer"
					>
						<option value={5}>5</option>
						<option value={10}>10</option>
						<option value={20}>20</option>
						<option value={40}>40</option>
						<option value={50}>50</option>
					</select>
				</div>
				<span className="text-xs text-zinc-500 font-medium whitespace-nowrap">{getPaginationText()}</span>
			</div>

			{totalPages > 1 && (
				<div className="flex items-center gap-1.5 flex-wrap">
					<button
						onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
						disabled={currentPage === 1}
						className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-semibold bg-white text-[#11236a] hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white transition-all cursor-pointer outline-none"
					>
						Previous
					</button>
					{getPageNumbers().map((page, idx) => {
						if (page === '...') {
							return (
								<span key={`ellipsis-${idx}`} className="px-2 text-xs text-zinc-400 font-bold select-none">
									...
								</span>
							);
						}
						const pageNum = Number(page);
						const isActive = currentPage === pageNum;
						return (
							<button
								key={pageNum}
								onClick={() => onPageChange(pageNum)}
								className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer border-none outline-none ${isActive ? 'bg-[#11236a] text-white shadow-sm shadow-[#11236a]/25' : 'bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900'}`}
							>
								{pageNum}
							</button>
						);
					})}
					<button
						onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
						disabled={currentPage === totalPages}
						className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-semibold bg-white text-[#11236a] hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white transition-all cursor-pointer outline-none"
					>
						Next
					</button>
				</div>
			)}
		</div>
	);
}