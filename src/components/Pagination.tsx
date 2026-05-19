interface PaginationProps {
	totalItems: number;
	itemsPerPage: number;
	currentPage: number;
	onPageChange: (page: number) => void;
	onItemsPerPageChange: (limit: number) => void;
	itemNamePlural?: string;
}

export default function Pagination({ totalItems, itemsPerPage, currentPage, onPageChange, onItemsPerPageChange, itemNamePlural = 'records' }: PaginationProps) {
	const totalPages = Math.ceil(totalItems / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;

	const getPaginationText = () => {
		if (totalItems <= itemsPerPage)	return `Showing all ${totalItems} ${totalItems === 1 ? itemNamePlural.replace(/s$/, '') : itemNamePlural}`;
		return `Showing ${startIndex + 1} to ${Math.min(endIndex, totalItems)} of ${totalItems} ${itemNamePlural}`;
	};

	if (totalItems === 0) return null;

	return (
		<div className="bg-zinc-50 border-t border-zinc-100 px-6 py-4 flex items-center justify-between flex-col sm:flex-row gap-4">
			<div className="flex items-center gap-2">
				<span className="text-xs text-zinc-405 font-medium">Rows per page:</span>
				<select
					value={itemsPerPage}
					onChange={(e) => {
						onItemsPerPageChange(Number(e.target.value));
					}}
					className="bg-white border border-zinc-200 rounded-lg text-xs font-semibold px-2 py-1 outline-none text-zinc-650 focus:border-[#11236a] cursor-pointer"
				>
					<option value={5}>5</option>
					<option value={10}>10</option>
					<option value={20}>20</option>
					<option value={50}>50</option>
				</select>
			</div>

			<span className="text-xs text-zinc-405 font-medium">{getPaginationText()}</span>

			{totalPages > 1 && (
				<div className="flex items-center gap-1.5">
					<button
						onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
						disabled={currentPage === 1}
						className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-semibold bg-white text-[#11236a] hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white transition-all cursor-pointer outline-none"
					>
						Previous
					</button>
					{Array.from({ length: totalPages }).map((_, idx) => {
						const pageNum = idx + 1;
						const isActive = currentPage === pageNum;
						return (
							<button
								key={pageNum}
								onClick={() => onPageChange(pageNum)}
								className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer border-none outline-none ${isActive ? 'bg-[#11236a] text-white shadow-sm shadow-[#11236a]/25' : 'bg-white hover:bg-zinc-100 text-zinc-650 hover:text-zinc-800'}`}
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