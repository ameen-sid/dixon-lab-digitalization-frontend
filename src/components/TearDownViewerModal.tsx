import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { X, Download, FileSpreadsheet, RefreshCw, Search, Eye, AlertTriangle } from 'lucide-react';

interface TearDownViewerModalProps {
	fileUrl: string;
	fileName?: string;
	onClose: () => void;
}

export const TearDownViewerModal: React.FC<TearDownViewerModalProps> = ({ fileUrl, fileName, onClose }) => {
	const [worksheets, setWorksheets] = useState<{ [sheetName: string]: XLSX.WorkSheet }>({});
	const [sheetNames, setSheetNames] = useState<string[]>([]);
	const [activeSheet, setActiveSheet] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [filterText, setFilterText] = useState<string>('');
	const [viewMode, setViewMode] = useState<'excel' | 'pdf' | 'google' | 'office'>('excel');

	const absoluteFileUrl = fileUrl.startsWith('http')
		? fileUrl
		: `${window.location.origin}${fileUrl}`;

	const isPdf = fileUrl.toLowerCase().endsWith('.pdf');

	useEffect(() => {
		if (isPdf) {
			setViewMode('pdf');
			setLoading(false);
			return;
		}

		let isMounted = true;
		setLoading(true);
		setError(null);

		const token = localStorage.getItem('token');
		const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

		fetch(absoluteFileUrl, { headers })
			.then((res) => {
				if (!res.ok) throw new Error(`Failed to fetch file (${res.status} ${res.statusText})`);
				return res.arrayBuffer();
			})
			.then((buffer) => {
				if (!isMounted) return;
				let wb: XLSX.WorkBook;
				try {
					wb = XLSX.read(buffer, {
						type: 'array',
						cellStyles: true,
						cellNF: true,
						cellDates: true,
						cellFormula: true
					});
				} catch (e1) {
					console.warn('Full style parse failed, attempting standard parse:', e1);
					wb = XLSX.read(buffer, { type: 'array' });
				}

				const sheetsMap: { [name: string]: XLSX.WorkSheet } = {};
				wb.SheetNames.forEach((name) => {
					sheetsMap[name] = wb.Sheets[name];
				});

				setSheetNames(wb.SheetNames);
				if (wb.SheetNames.length > 0) {
					setActiveSheet(wb.SheetNames[0]);
				}
				setWorksheets(sheetsMap);
				setLoading(false);
			})
			.catch((err) => {
				if (!isMounted) return;
				console.error('Failed to parse Excel file:', err);
				setError('Could not preview file natively. You can still download or use Google / MS Office viewer.');
				setLoading(false);
			});

		return () => {
			isMounted = false;
		};
	}, [absoluteFileUrl, isPdf]);

	const currentSheet = worksheets[activeSheet];

	const getSheetRange = (sheet: XLSX.WorkSheet | undefined) => {
		if (!sheet || !sheet['!ref']) return { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 };
		try {
			const range = XLSX.utils.decode_range(sheet['!ref']);
			return {
				minRow: range.s.r,
				maxRow: range.e.r,
				minCol: range.s.c,
				maxCol: range.e.c
			};
		} catch {
			return { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 };
		}
	};

	const { minRow, maxRow, minCol, maxCol } = getSheetRange(currentSheet);
	const totalCols = currentSheet ? maxCol - minCol + 1 : 0;
	const totalRows = currentSheet ? maxRow - minRow + 1 : 0;

	const getColumnLabel = (colIdx: number) => {
		let label = '';
		let n = colIdx;
		while (n >= 0) {
			label = String.fromCharCode((n % 26) + 65) + label;
			n = Math.floor(n / 26) - 1;
		}
		return label;
	};

	const parseCellCss = (cell: XLSX.CellObject | undefined): React.CSSProperties => {
		if (!cell || !cell.s || typeof cell.s !== 'object') return {};
		const css: React.CSSProperties = {};
		const s = cell.s as any;

		try {
			if (s.fill && typeof s.fill === 'object') {
				if (s.fill.fgColor && typeof s.fill.fgColor === 'object') {
					if (typeof s.fill.fgColor.rgb === 'string') {
						const rgb = s.fill.fgColor.rgb;
						css.backgroundColor = rgb.startsWith('#') ? rgb : `#${rgb.length === 8 ? rgb.slice(2) : rgb}`;
					} else if (typeof s.fill.fgColor.theme === 'number') {
						const themeColors = ['#FFFFFF', '#000000', '#E7E6E6', '#44546A', '#5B9BD5', '#ED7D31', '#A5A5A5', '#FFC000', '#4472C4', '#70AD47'];
						css.backgroundColor = themeColors[s.fill.fgColor.theme] || '#F3F4F6';
					}
				} else if (s.fill.bgColor && typeof s.fill.bgColor === 'object' && typeof s.fill.bgColor.rgb === 'string') {
					const rgb = s.fill.bgColor.rgb;
					css.backgroundColor = rgb.startsWith('#') ? rgb : `#${rgb.length === 8 ? rgb.slice(2) : rgb}`;
				}
			}

			if (s.font && typeof s.font === 'object') {
				if (s.font.bold) css.fontWeight = 'bold';
				if (s.font.italic) css.fontStyle = 'italic';
				if (s.font.underline) css.textDecoration = 'underline';
				if (typeof s.font.sz === 'number') css.fontSize = `${Math.min(16, Math.max(9, s.font.sz))}pt`;
				if (typeof s.font.name === 'string') css.fontFamily = s.font.name;
				if (s.font.color && typeof s.font.color === 'object') {
					if (typeof s.font.color.rgb === 'string') {
						const rgb = s.font.color.rgb;
						css.color = rgb.startsWith('#') ? rgb : `#${rgb.length === 8 ? rgb.slice(2) : rgb}`;
					} else if (typeof s.font.color.theme === 'number') {
						const themeColors = ['#000000', '#FFFFFF', '#1F497D', '#4F81BD', '#C00000', '#9BBB59', '#8064A2', '#4BACC6', '#F79646'];
						css.color = themeColors[s.font.color.theme] || '#111827';
					}
				}
			}

			if (s.alignment && typeof s.alignment === 'object') {
				if (typeof s.alignment.horizontal === 'string') {
					css.textAlign = s.alignment.horizontal as React.CSSProperties['textAlign'];
				}
				if (typeof s.alignment.vertical === 'string') {
					const v = s.alignment.vertical;
					css.verticalAlign = v === 'center' ? 'middle' : v;
				}
				if (s.alignment.wrapText) {
					css.whiteSpace = 'pre-wrap';
					css.wordBreak = 'break-word';
				}
			}

			if (s.border && typeof s.border === 'object') {
				const b = s.border;
				if (b.top) css.borderTop = '1px solid #cbd5e1';
				if (b.bottom) css.borderBottom = '1px solid #cbd5e1';
				if (b.left) css.borderLeft = '1px solid #cbd5e1';
				if (b.right) css.borderRight = '1px solid #cbd5e1';
			}
		} catch {
			// Suppress style parsing errors gracefully
		}
		return css;
	};

	const merges = currentSheet ? (currentSheet['!merges'] || []) : [];

	const getMergeInfo = (r: number, c: number) => {
		for (const range of merges) {
			if (r >= range.s.r && r <= range.e.r && c >= range.s.c && c <= range.e.c) {
				if (r === range.s.r && c === range.s.c) {
					return {
						isOrigin: true,
						rowSpan: range.e.r - range.s.r + 1,
						colSpan: range.e.c - range.s.c + 1
					};
				}
				return { isOrigin: false, covered: true };
			}
		}
		return null;
	};

	const colsSpec = currentSheet ? (currentSheet['!cols'] || []) : [];

	const getColWidth = (cIdx: number) => {
		const spec = colsSpec[cIdx];
		if (spec) {
			if (spec.wpx) return `${spec.wpx}px`;
			if (spec.wch) return `${Math.max(80, spec.wch * 9)}px`;
		}
		return '130px';
	};

	const rowIndices = Array.from({ length: totalRows }, (_, idx) => minRow + idx);
	const filteredRowIndices = rowIndices.filter((r) => {
		if (!filterText.trim()) return true;
		const query = filterText.toLowerCase();
		for (let c = minCol; c <= maxCol; c++) {
			const cellRef = XLSX.utils.encode_cell({ r, c });
			const cell = currentSheet ? currentSheet[cellRef] : null;
			const cellVal = cell ? (cell.w || cell.v || '') : '';
			if (String(cellVal).toLowerCase().includes(query)) return true;
		}
		return false;
	});

	const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(absoluteFileUrl)}&embedded=true`;
	const officeViewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(absoluteFileUrl)}`;

	return (
		<div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
			<div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-scale-up">
				<div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
							<FileSpreadsheet className="w-5 h-5" />
						</div>
						<div>
							<h3 className="text-sm font-black tracking-wide text-white flex items-center gap-2">
								<span>Tear Down Analysis Report Viewer</span>
								<span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
									{isPdf ? 'PDF' : 'XLSX Sheet (Styled)'}
								</span>
							</h3>
							<p className="text-[11px] text-slate-400 font-semibold truncate max-w-xs sm:max-w-md">
								{fileName || 'Tear_Down_Report.xlsx'}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2.5 flex-wrap">
						{!isPdf && (
							<div className="flex items-center bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-700">
								<button
									onClick={() => setViewMode('excel')}
									className={`px-3 py-1 rounded-lg transition-all ${
										viewMode === 'excel' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
									}`}
								>
									Styled Excel Sheet
								</button>
								<button
									onClick={() => setViewMode('google')}
									className={`px-3 py-1 rounded-lg transition-all ${
										viewMode === 'google' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
									}`}
								>
									Google Viewer
								</button>
								<button
									onClick={() => setViewMode('office')}
									className={`px-3 py-1 rounded-lg transition-all ${
										viewMode === 'office' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
									}`}
								>
									MS Office
								</button>
							</div>
						)}
						<a
							href={absoluteFileUrl}
							download={fileName || 'Tear_Down_Report.xlsx'}
							className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95 border-none"
						>
							<Download className="w-3.5 h-3.5" />
							<span>Download File</span>
						</a>
						<button
							onClick={onClose}
							className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-xl transition-all border-none cursor-pointer"
						>
							<X className="w-5 h-5" />
						</button>
					</div>
				</div>
				{!isPdf && viewMode === 'excel' && !loading && !error && (
					<div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
						<div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5">
							<span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mr-1 shrink-0">Worksheets:</span>
							{sheetNames.map((name) => (
								<button
									key={name}
									onClick={() => setActiveSheet(name)}
									className={`px-3.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap border ${
										activeSheet === name
											? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
											: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-200'
									}`}
								>
									{name}
								</button>
							))}
						</div>
						<div className="relative shrink-0">
							<Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
							<input
								type="text"
								placeholder="Search sheet content..."
								value={filterText}
								onChange={(e) => setFilterText(e.target.value)}
								className="pl-8 pr-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-600 transition-all w-52"
							/>
						</div>
					</div>
				)}
				<div className="flex-1 bg-slate-200 relative overflow-hidden flex flex-col">
					{loading ? (
						<div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600 bg-white">
							<RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
							<p className="text-xs font-bold">Rendering Styled Excel Sheet...</p>
						</div>
					) : viewMode === 'pdf' ? (
						<iframe
							src={absoluteFileUrl}
							className="w-full h-full border-none"
							title="Tear Down Report PDF Preview"
						/>
					) : viewMode === 'google' ? (
						<iframe
							src={googleViewerUrl}
							className="w-full h-full border-none"
							title="Tear Down Report Google Preview"
						/>
					) : viewMode === 'office' ? (
						<iframe
							src={officeViewerUrl}
							className="w-full h-full border-none"
							title="Tear Down Report Office Preview"
						/>
					) : error ? (
						<div className="flex flex-col items-center justify-center h-full p-8 text-center gap-3 bg-white">
							<AlertTriangle className="w-10 h-10 text-amber-500" />
							<p className="text-xs font-bold text-slate-700">{error}</p>
							<div className="flex items-center gap-3 mt-2">
								<button
									onClick={() => setViewMode('google')}
									className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
								>
									Try Google Viewer
								</button>
								<a
									href={absoluteFileUrl}
									download={fileName || 'Tear_Down_Report.xlsx'}
									className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
								>
									Download File
								</a>
							</div>
						</div>
					) : totalRows === 0 ? (
						<div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 bg-white">
							<FileSpreadsheet className="w-10 h-10 text-slate-300" />
							<p className="text-xs font-bold">This worksheet contains no printable rows.</p>
						</div>
					) : (
						<div className="flex-1 overflow-auto p-4 bg-slate-300">
							<div className="inline-block min-w-full bg-white rounded-xl shadow-md border border-slate-400 overflow-hidden">
								<table className="w-full text-left border-collapse text-xs font-medium border-slate-300">
									<thead>
										<tr className="bg-slate-200 text-slate-700 border-b border-slate-300 font-extrabold text-[10px] uppercase">
											<th className="w-12 py-2 px-2 text-center border-r border-b border-slate-300 bg-slate-300/80 text-slate-600 select-none shrink-0">
												#
											</th>
											{Array.from({ length: totalCols }).map((_, colOffset) => {
												const c = minCol + colOffset;
												return (
													<th
														key={c}
														style={{ width: getColWidth(c), minWidth: getColWidth(c) }}
														className="py-2 px-3 border-r border-b border-slate-300 bg-slate-200/90 text-slate-700 text-center select-none"
													>
														{getColumnLabel(c)}
													</th>
												);
											})}
										</tr>
									</thead>
									<tbody>
										{filteredRowIndices.map((r) => {
											return (
												<tr key={r} className="border-b border-slate-200 hover:bg-slate-50/70 transition-colors">
													<td className="py-2 px-2 text-center border-r border-slate-300 bg-slate-100/90 font-extrabold text-slate-400 text-[10px] select-none">
														{r + 1}
													</td>
													{Array.from({ length: totalCols }).map((_, colOffset) => {
														const c = minCol + colOffset;
														const mergeInfo = getMergeInfo(r, c);
														if (mergeInfo && mergeInfo.covered) {
															return null;
														}
														const cellRef = XLSX.utils.encode_cell({ r, c });
														const cell = currentSheet ? currentSheet[cellRef] : undefined;
														const cellCss = parseCellCss(cell);
														const formattedVal = cell
															? (cell.w !== undefined && cell.w !== null
																	? String(cell.w)
																	: cell.v !== undefined && cell.v !== null
																		? String(cell.v)
																		: '')
															: '';
														return (
															<td
																key={c}
																rowSpan={mergeInfo?.isOrigin ? mergeInfo.rowSpan : undefined}
																colSpan={mergeInfo?.isOrigin ? mergeInfo.colSpan : undefined}
																style={{
																	...cellCss,
																	minWidth: getColWidth(c)
																}}
																className={`py-2 px-3 border-r border-slate-200 text-slate-800 ${
																	!cellCss.whiteSpace ? 'whitespace-pre-wrap wrap-break-word' : ''
																}`}
															>
																{formattedVal}
															</td>
														);
													})}
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>
				<div className="px-5 py-2.5 bg-slate-900 text-slate-300 text-xs flex items-center justify-between border-t border-slate-800 shrink-0">
					<div className="flex items-center gap-2 font-semibold text-[11px]">
						<Eye className="w-3.5 h-3.5 text-emerald-400" />
						<span>
							Styled Sheet Engine Active • {sheetNames.length} Sheet(s) • {totalRows} Row(s) • Merged Cells & Formatting Preserved
						</span>
					</div>
					<div className="text-[11px] text-slate-400 italic">
						Viewing Tear Down Report with cell colors, fonts, borders, and merges.
					</div>
				</div>
			</div>
		</div>
	);
};