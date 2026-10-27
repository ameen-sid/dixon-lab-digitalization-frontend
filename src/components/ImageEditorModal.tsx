import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
	Pen,
	Crop,
	Type,
	RotateCw,
	RotateCcw,
	Check,
	X,
	Undo2,
	Trash2,
	Move,
	Plus,
	Square,
	ArrowRight
} from 'lucide-react';

export interface ImageEditorSaveResult {
	dataUrl: string;
	file?: File;
}

export interface ImageEditorModalProps {
	isOpen: boolean;
	imageSrc: string | null;
	title?: string;
	originalFileName?: string;
	onSave: (result: ImageEditorSaveResult) => void;
	onClose: () => void;
}

interface TextItem {
	id: number;
	text: string;
	x: number;
	y: number;
	color: string;
	fontSize: number;
}

type ActiveTool = 'pen' | 'arrow' | 'rect' | 'crop' | 'text';

const COLOR_OPTIONS = [
	'#EF4444', 
	'#2563EB', 
	'#10B981', 
	'#F59E0B', 
	'#8B5CF6', 
	'#000000', 
	'#FFFFFF'  
];

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
	isOpen,
	imageSrc,
	title = 'Edit & Annotate Image',
	originalFileName = 'inspection_photo.png',
	onSave,
	onClose
}) => {
	const [activeTool, setActiveTool] = useState<ActiveTool>('pen');
	const [color, setColor] = useState('#EF4444');
	const [lineWidth, setLineWidth] = useState(4);
	const [textInput, setTextInput] = useState('');
	const [fontSize, setFontSize] = useState(24);
	const [history, setHistory] = useState<string[]>([]);

	const [isDrawing, setIsDrawing] = useState(false);
	const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);
	const [shapeCurrent, setShapeCurrent] = useState<{ x: number; y: number } | null>(null);

	const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
	const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null);
	const [isCropping, setIsCropping] = useState(false);

	const [textItems, setTextItems] = useState<TextItem[]>([]);
	const [selectedTextId, setSelectedTextId] = useState<number | null>(null);
	const [isDraggingText, setIsDraggingText] = useState(false);
	const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);

	const previewSnapshotRef = useRef<ImageData | null>(null);

	useEffect(() => {
		if (!isOpen || !imageSrc) return;

		let isMounted = true;
		const img = new Image();
		if (!imageSrc.startsWith('data:')) {
			img.crossOrigin = 'anonymous';
		}
		img.onload = () => {
			const initCanvas = () => {
				if (!isMounted) return;
				const canvas = canvasRef.current;
				if (!canvas) {
					requestAnimationFrame(initCanvas);
					return;
				}
				const ctx = canvas.getContext('2d');
				if (!ctx) return;

				let w = img.naturalWidth || img.width;
				let h = img.naturalHeight || img.height;

				const MAX_DIM = 4096;
				if (w > MAX_DIM || h > MAX_DIM) {
					const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
					w = Math.round(w * ratio);
					h = Math.round(h * ratio);
				}

				canvas.width = w;
				canvas.height = h;

				ctx.clearRect(0, 0, w, h);
				ctx.drawImage(img, 0, 0, w, h);

				setHistory([canvas.toDataURL('image/png')]);
				setCropStart(null);
				setCropEnd(null);
				setIsCropping(false);
				setTextItems([]);
				setSelectedTextId(null);
				setTextInput('');
				setShapeStart(null);
				setShapeCurrent(null);
			};
			initCanvas();
		};
		img.onerror = (err) => {
			console.error('Failed to load image in editor:', err);
		};
		img.src = imageSrc;

		return () => {
			isMounted = false;
		};
	}, [isOpen, imageSrc]);

	const saveSnapshot = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		setHistory((prev) => [...prev, canvas.toDataURL('image/png')]);
	}, []);

	const handleUndo = () => {
		if (history.length <= 1) return;
		const newHist = history.slice(0, history.length - 1);
		const prevSnapshot = newHist[newHist.length - 1];
		setHistory(newHist);

		const img = new Image();
		img.src = prevSnapshot;
		img.onload = () => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d');
			if (ctx) {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(img, 0, 0);
			}
		};
	};

	const handleReset = () => {
		if (history.length === 0) return;
		const originalSnapshot = history[0];
		const img = new Image();
		img.src = originalSnapshot;
		img.onload = () => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d');
			if (ctx) {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(img, 0, 0);
			}
			setHistory([originalSnapshot]);
			setCropStart(null);
			setCropEnd(null);
			setTextItems([]);
			setSelectedTextId(null);
			setShapeStart(null);
			setShapeCurrent(null);
		};
	};

	const handleRotate = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		burnTextToCanvas();

		const oldWidth = canvas.width;
		const oldHeight = canvas.height;

		const temp = document.createElement('canvas');
		temp.width = oldWidth;
		temp.height = oldHeight;
		const tempCtx = temp.getContext('2d');
		if (!tempCtx) return;
		tempCtx.drawImage(canvas, 0, 0);

		canvas.width = oldHeight;
		canvas.height = oldWidth;

		ctx.save();
		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.rotate((90 * Math.PI) / 180);
		ctx.drawImage(temp, -oldWidth / 2, -oldHeight / 2);
		ctx.restore();

		saveSnapshot();
	};

	const getCanvasCoords = (e: { clientX: number; clientY: number }) => {
		const canvas = canvasRef.current;
		if (!canvas) return { x: 0, y: 0 };
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		return {
			x: Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * scaleX)),
			y: Math.max(0, Math.min(canvas.height, (e.clientY - rect.top) * scaleY))
		};
	};

	const drawArrow = (
		ctx: CanvasRenderingContext2D,
		fromX: number,
		fromY: number,
		toX: number,
		toY: number,
		strokeColor: string,
		width: number
	) => {
		const headLength = Math.max(16, width * 4);
		const angle = Math.atan2(toY - fromY, toX - fromX);

		ctx.save();
		ctx.strokeStyle = strokeColor;
		ctx.fillStyle = strokeColor;
		ctx.lineWidth = width;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';

		ctx.beginPath();
		ctx.moveTo(fromX, fromY);
		ctx.lineTo(toX, toY);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(toX, toY);
		ctx.lineTo(
			toX - headLength * Math.cos(angle - Math.PI / 6),
			toY - headLength * Math.sin(angle - Math.PI / 6)
		);
		ctx.lineTo(
			toX - headLength * Math.cos(angle + Math.PI / 6),
			toY - headLength * Math.sin(angle + Math.PI / 6)
		);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	};

	const drawRectBox = (
		ctx: CanvasRenderingContext2D,
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		strokeColor: string,
		width: number
	) => {
		const left = Math.min(x1, x2);
		const top = Math.min(y1, y2);
		const w = Math.abs(x2 - x1);
		const h = Math.abs(y2 - y1);

		ctx.save();
		ctx.strokeStyle = strokeColor;
		ctx.lineWidth = width;
		ctx.lineJoin = 'round';

		ctx.fillStyle = strokeColor + '1A';
		ctx.fillRect(left, top, w, h);

		ctx.strokeRect(left, top, w, h);
		ctx.restore();
	};

	const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const coords = getCanvasCoords(e);

		if (activeTool === 'pen') {
			ctx.beginPath();
			ctx.moveTo(coords.x, coords.y);
			ctx.strokeStyle = color;
			ctx.lineWidth = lineWidth;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			setIsDrawing(true);
		} else if (activeTool === 'arrow' || activeTool === 'rect') {
			previewSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
			setShapeStart(coords);
			setShapeCurrent(coords);
			setIsDrawing(true);
		} else if (activeTool === 'crop') {
			setCropStart(coords);
			setCropEnd(coords);
			setIsCropping(true);
		} else if (activeTool === 'text') {
			setSelectedTextId(null);
		}
	};

	const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const coords = getCanvasCoords(e);

		if (activeTool === 'pen' && isDrawing) {
			ctx.lineTo(coords.x, coords.y);
			ctx.stroke();
		} else if ((activeTool === 'arrow' || activeTool === 'rect') && isDrawing && shapeStart && previewSnapshotRef.current) {
			ctx.putImageData(previewSnapshotRef.current, 0, 0);
			setShapeCurrent(coords);

			if (activeTool === 'arrow') {
				drawArrow(ctx, shapeStart.x, shapeStart.y, coords.x, coords.y, color, lineWidth);
			} else if (activeTool === 'rect') {
				drawRectBox(ctx, shapeStart.x, shapeStart.y, coords.x, coords.y, color, lineWidth);
			}
		} else if (activeTool === 'crop' && isCropping) {
			setCropEnd(coords);
		}
	};

	const handlePointerUp = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');

		if (activeTool === 'pen' && isDrawing) {
			if (ctx) ctx.closePath();
			setIsDrawing(false);
			saveSnapshot();
		} else if ((activeTool === 'arrow' || activeTool === 'rect') && isDrawing && shapeStart && shapeCurrent) {
			if (ctx && previewSnapshotRef.current) {
				ctx.putImageData(previewSnapshotRef.current, 0, 0);
				if (activeTool === 'arrow') {
					drawArrow(ctx, shapeStart.x, shapeStart.y, shapeCurrent.x, shapeCurrent.y, color, lineWidth);
				} else if (activeTool === 'rect') {
					drawRectBox(ctx, shapeStart.x, shapeStart.y, shapeCurrent.x, shapeCurrent.y, color, lineWidth);
				}
			}
			setIsDrawing(false);
			setShapeStart(null);
			setShapeCurrent(null);
			previewSnapshotRef.current = null;
			saveSnapshot();
		} else if (activeTool === 'crop' && isCropping) {
			setIsCropping(false);
		}
	};

	const handleAddText = () => {
		const textToAdd = textInput.trim() || 'Defect Note';
		const canvas = canvasRef.current;
		const initialX = canvas ? canvas.width / 2 - 100 : 50;
		const initialY = canvas ? canvas.height / 2 - 20 : 50;

		const newItem: TextItem = {
			id: Date.now(),
			text: textToAdd,
			x: Math.max(20, initialX + textItems.length * 20),
			y: Math.max(20, initialY + textItems.length * 20),
			color: color,
			fontSize: fontSize
		};

		setTextItems((prev) => [...prev, newItem]);
		setSelectedTextId(newItem.id);
		setTextInput('');
	};

	const handleTextPointerDown = (e: React.PointerEvent<HTMLDivElement>, item: TextItem) => {
		e.stopPropagation();
		setSelectedTextId(item.id);
		setIsDraggingText(true);

		const canvas = canvasRef.current;
		if (!canvas) return;
		const coords = getCanvasCoords(e);
		dragOffsetRef.current = {
			x: coords.x - item.x,
			y: coords.y - item.y
		};
	};

	useEffect(() => {
		const handleWindowPointerMove = (e: PointerEvent) => {
			if (!isDraggingText || selectedTextId === null) return;
			const canvas = canvasRef.current;
			if (!canvas) return;

			const coords = getCanvasCoords(e);
			const newX = coords.x - dragOffsetRef.current.x;
			const newY = coords.y - dragOffsetRef.current.y;

			setTextItems((prev) =>
				prev.map((item) =>
					item.id === selectedTextId
						? {
							...item,
							x: Math.max(0, Math.min(canvas.width - 50, newX)),
							y: Math.max(0, Math.min(canvas.height - 30, newY))
						}
						: item
				)
			);
		};

		const handleWindowPointerUp = () => {
			if (isDraggingText) {
				setIsDraggingText(false);
			}
		};

		if (isDraggingText) {
			window.addEventListener('pointermove', handleWindowPointerMove);
			window.addEventListener('pointerup', handleWindowPointerUp);
		}

		return () => {
			window.removeEventListener('pointermove', handleWindowPointerMove);
			window.removeEventListener('pointerup', handleWindowPointerUp);
		};
	}, [isDraggingText, selectedTextId]);

	const handleUpdateSelectedText = (field: 'text' | 'color' | 'fontSize', val: any) => {
		if (!selectedTextId) return;
		setTextItems((prev) =>
			prev.map((item) => (item.id === selectedTextId ? { ...item, [field]: val } : item))
		);
	};

	const handleDeleteText = (id: number) => {
		setTextItems((prev) => prev.filter((item) => item.id !== id));
		if (selectedTextId === id) setSelectedTextId(null);
	};

	const applyCrop = () => {
		if (!cropStart || !cropEnd) return;
		const canvas = canvasRef.current;
		if (!canvas) return;

		const x = Math.max(0, Math.min(cropStart.x, cropEnd.x));
		const y = Math.max(0, Math.min(cropStart.y, cropEnd.y));
		const width = Math.min(canvas.width - x, Math.abs(cropEnd.x - cropStart.x));
		const height = Math.min(canvas.height - y, Math.abs(cropEnd.y - cropStart.y));

		if (width < 30 || height < 30) {
			alert('Selected crop region is too small.');
			return;
		}

		burnTextToCanvas();

		const tempCanvas = document.createElement('canvas');
		tempCanvas.width = width;
		tempCanvas.height = height;
		const tempCtx = tempCanvas.getContext('2d');
		if (!tempCtx) return;

		tempCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);

		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.clearRect(0, 0, width, height);
			ctx.drawImage(tempCanvas, 0, 0);
		}

		setCropStart(null);
		setCropEnd(null);
		setIsCropping(false);
		setTextItems([]);
		setSelectedTextId(null);
		saveSnapshot();
	};

	const cancelCrop = () => {
		setCropStart(null);
		setCropEnd(null);
		setIsCropping(false);
	};

	const burnTextToCanvas = () => {
		const canvas = canvasRef.current;
		if (!canvas || textItems.length === 0) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		textItems.forEach((item) => {
			ctx.save();
			ctx.font = `bold ${item.fontSize}px sans-serif`;
			ctx.textBaseline = 'top';

			const metrics = ctx.measureText(item.text);
			const textWidth = metrics.width;
			const textHeight = item.fontSize;

			const paddingX = Math.round(item.fontSize * 0.4);
			const paddingY = Math.round(item.fontSize * 0.25);
			const radius = Math.round(item.fontSize * 0.25);

			const rectX = item.x;
			const rectY = item.y;
			const rectW = textWidth + paddingX * 2;
			const rectH = textHeight + paddingY * 2;

			ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
			ctx.beginPath();
			if (typeof ctx.roundRect === 'function') {
				ctx.roundRect(rectX, rectY, rectW, rectH, radius);
			} else {
				ctx.rect(rectX, rectY, rectW, rectH);
			}
			ctx.fill();

			ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
			ctx.lineWidth = 1.5;
			ctx.stroke();
			ctx.fillStyle = item.color;
			ctx.fillText(item.text, rectX + paddingX, rectY + paddingY);
			ctx.restore();
		});

		setTextItems([]);
		setSelectedTextId(null);
	};

	const handleSave = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		burnTextToCanvas();

		const dataUrl = canvas.toDataURL('image/png');

		const processSave = (blob: Blob | null) => {
			let file: File | undefined = undefined;
			const safeName = (originalFileName || 'image.png').replace(/\.[^/.]+$/, '') + '_annotated.png';
			if (blob) {
				file = new File([blob], safeName, { type: 'image/png' });
			} else {
				try {
					const arr = dataUrl.split(',');
					const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
					const bstr = atob(arr[1]);
					let n = bstr.length;
					const u8arr = new Uint8Array(n);
					while (n--) {
						u8arr[n] = bstr.charCodeAt(n);
					}
					file = new File([u8arr], safeName, { type: mime });
				} catch (err) {
					console.error('Error generating fallback file:', err);
				}
			}
			onSave({ dataUrl, file });
		};

		if (canvas.toBlob) {
			canvas.toBlob(processSave, 'image/png');
		} else {
			processSave(null);
		}
	};

	if (!isOpen) return null;

	let cropOverlay: { left: number; top: number; width: number; height: number } | null = null;
	if (canvasRef.current && cropStart && cropEnd) {
		const canvas = canvasRef.current;
		const rect = canvas.getBoundingClientRect();
		const scaleX = rect.width / canvas.width;
		const scaleY = rect.height / canvas.height;

		const x = Math.min(cropStart.x, cropEnd.x) * scaleX;
		const y = Math.min(cropStart.y, cropEnd.y) * scaleY;
		const w = Math.abs(cropEnd.x - cropStart.x) * scaleX;
		const h = Math.abs(cropEnd.y - cropStart.y) * scaleY;

		cropOverlay = { left: x, top: y, width: w, height: h };
	}

	const selectedTextObj = textItems.find((t) => t.id === selectedTextId);

	const modalContent = (
		<div
			className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150 select-none"
		>
			<div
				className="bg-white rounded-3xl w-full max-w-5xl max-h-[94vh] shadow-2xl border border-zinc-200 overflow-hidden flex flex-col"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Modal Top Bar */}
				<div className="px-6 py-3.5 border-b border-zinc-200 flex items-center justify-between bg-[#11236a]">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center">
							<Pen className="w-4 h-4 text-indigo-300" />
						</div>
						<div>
							<h3 className="text-sm font-extrabold text-white tracking-tight">{title}</h3>
							<p className="text-[11px] text-indigo-200 font-medium">
								Draw, point arrows, crop defects, or add notes before uploading
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={handleRotate}
							className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all cursor-pointer"
							title="Rotate 90° Clockwise"
						>
							<RotateCw className="w-3.5 h-3.5" />
							<span>Rotate</span>
						</button>

						<button
							type="button"
							onClick={handleUndo}
							disabled={history.length <= 1}
							className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
							title="Undo last stroke or action"
						>
							<Undo2 className="w-3.5 h-3.5" />
							<span>Undo</span>
						</button>

						<button
							type="button"
							onClick={handleReset}
							className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all cursor-pointer"
							title="Reset image to original"
						>
							<RotateCcw className="w-3.5 h-3.5" />
							<span>Reset</span>
						</button>

						<button
							type="button"
							onClick={onClose}
							className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
						>
							<X className="w-5 h-5" />
						</button>
					</div>
				</div>

				{/* Toolbar Controls */}
				<div className="px-5 py-2.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between gap-4 flex-wrap text-xs">
					{/* Tool selector buttons */}
					<div className="flex items-center gap-1 p-1 bg-zinc-200/70 rounded-2xl">
						<button
							type="button"
							onClick={() => {
								setActiveTool('pen');
								cancelCrop();
							}}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
								activeTool === 'pen'
									? 'bg-white text-[#11236a] shadow-xs'
									: 'text-zinc-600 hover:text-zinc-900'
							}`}
							title="Freehand drawing"
						>
							<Pen className="w-3.5 h-3.5" />
							<span>Pen</span>
						</button>

						<button
							type="button"
							onClick={() => {
								setActiveTool('arrow');
								cancelCrop();
							}}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
								activeTool === 'arrow'
									? 'bg-white text-[#11236a] shadow-xs'
									: 'text-zinc-600 hover:text-zinc-900'
							}`}
							title="Draw pointing arrow to defect"
						>
							<ArrowRight className="w-3.5 h-3.5" />
							<span>Arrow</span>
						</button>

						<button
							type="button"
							onClick={() => {
								setActiveTool('rect');
								cancelCrop();
							}}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
								activeTool === 'rect'
									? 'bg-white text-[#11236a] shadow-xs'
									: 'text-zinc-600 hover:text-zinc-900'
							}`}
							title="Draw highlight box"
						>
							<Square className="w-3.5 h-3.5" />
							<span>Box</span>
						</button>

						<button
							type="button"
							onClick={() => setActiveTool('crop')}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
								activeTool === 'crop'
									? 'bg-white text-[#11236a] shadow-xs'
									: 'text-zinc-600 hover:text-zinc-900'
							}`}
							title="Crop portion of image"
						>
							<Crop className="w-3.5 h-3.5" />
							<span>Crop</span>
						</button>

						<button
							type="button"
							onClick={() => {
								setActiveTool('text');
								cancelCrop();
							}}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
								activeTool === 'text'
									? 'bg-white text-[#11236a] shadow-xs'
									: 'text-zinc-600 hover:text-zinc-900'
							}`}
							title="Add movable text annotation"
						>
							<Type className="w-3.5 h-3.5" />
							<span>Add Text</span>
						</button>
					</div>

					{/* Tool Specific Configs */}
					<div className="flex items-center gap-4 flex-wrap">
						{/* Color Palette (for Pen, Arrow, Box, Text) */}
						{activeTool !== 'crop' && (
							<div className="flex items-center gap-2">
								<span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Color:</span>
								<div className="flex items-center gap-1.5">
									{COLOR_OPTIONS.map((c) => (
										<button
											type="button"
											key={c}
											onClick={() => {
												setColor(c);
												if (selectedTextId) {
													handleUpdateSelectedText('color', c);
												}
											}}
											style={{ backgroundColor: c }}
											className={`w-5 h-5 rounded-full border border-zinc-300 transition-all ${
												color === c ? 'scale-125 ring-2 ring-[#11236a] ring-offset-2' : 'hover:scale-110'
											}`}
											title={c}
										/>
									))}
								</div>
							</div>
						)}

						{/* Stroke Width Slider (for Pen, Arrow, Box) */}
						{['pen', 'arrow', 'rect'].includes(activeTool) && (
							<div className="flex items-center gap-2">
								<span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Width:</span>
								<input
									type="range"
									min="1"
									max="16"
									value={lineWidth}
									onChange={(e) => setLineWidth(Number(e.target.value))}
									className="w-20 accent-[#11236a] cursor-pointer"
								/>
								<span className="text-[11px] font-black text-zinc-800 w-4">{lineWidth}px</span>
							</div>
						)}

						{/* Text Tool Inputs */}
						{activeTool === 'text' && (
							<div className="flex items-center gap-2">
								<input
									type="text"
									value={textInput}
									onChange={(e) => setTextInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											handleAddText();
										}
									}}
									placeholder="Type note or defect tag..."
									className="bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#11236a] w-48 font-medium"
								/>
								<select
									value={fontSize}
									onChange={(e) => {
										const newSize = Number(e.target.value);
										setFontSize(newSize);
										if (selectedTextId) {
											handleUpdateSelectedText('fontSize', newSize);
										}
									}}
									className="bg-white border border-zinc-300 rounded-xl px-2 py-1.5 text-xs text-zinc-700 focus:outline-none cursor-pointer font-bold"
								>
									<option value="18">Small (18px)</option>
									<option value="24">Normal (24px)</option>
									<option value="32">Medium (32px)</option>
									<option value="42">Large (42px)</option>
									<option value="56">X-Large (56px)</option>
								</select>

								<button
									type="button"
									onClick={handleAddText}
									className="flex items-center gap-1 px-3 py-1.5 bg-[#11236a] hover:bg-[#0c1a52] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
								>
									<Plus className="w-3.5 h-3.5" />
									<span>Place Tag</span>
								</button>
							</div>
						)}

						{/* Crop Actions */}
						{activeTool === 'crop' && (
							<div className="flex items-center gap-2">
								<span className="text-[11px] text-zinc-500 font-medium">Drag a box over the image:</span>
								<button
									type="button"
									onClick={applyCrop}
									disabled={!cropStart || !cropEnd}
									className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:bg-zinc-200 disabled:text-zinc-400 cursor-pointer"
								>
									Apply Crop
								</button>
								{cropStart && (
									<button
										type="button"
										onClick={cancelCrop}
										className="px-2.5 py-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
									>
										Cancel
									</button>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Selected Text Floating Property Strip */}
				{selectedTextObj && (
					<div className="px-5 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-950 animate-in fade-in">
						<div className="flex items-center gap-3">
							<span className="font-bold flex items-center gap-1 text-[11px]">
								<Move className="w-3.5 h-3.5 text-indigo-600" />
								Selected Note:
							</span>
							<input
								type="text"
								value={selectedTextObj.text}
								onChange={(e) => handleUpdateSelectedText('text', e.target.value)}
								className="bg-white border border-indigo-200 rounded-lg px-2 py-0.5 text-xs text-zinc-800 outline-none w-52 font-semibold"
							/>
							<span className="text-[11px] text-indigo-700 font-medium">
								Drag tag directly on the image to position it
							</span>
						</div>

						<button
							type="button"
							onClick={() => handleDeleteText(selectedTextObj.id)}
							className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 px-2 py-0.5 rounded-lg hover:bg-rose-50 cursor-pointer"
						>
							<Trash2 className="w-3.5 h-3.5" />
							<span>Delete Note</span>
						</button>
					</div>
				)}

				{/* Canvas Display Viewport */}
				<div
					ref={containerRef}
					className="flex-1 overflow-auto p-4 flex items-center justify-center bg-zinc-900/95 relative min-h-[380px] max-h-[64vh]"
				>
					<div className="relative inline-block shadow-2xl rounded">
						<canvas
							ref={canvasRef}
							onPointerDown={handlePointerDown}
							onPointerMove={handlePointerMove}
							onPointerUp={handlePointerUp}
							onPointerLeave={handlePointerUp}
							className={`max-w-full max-h-[60vh] object-contain rounded bg-white touch-none ${
								activeTool === 'pen' || activeTool === 'arrow' || activeTool === 'rect' || activeTool === 'crop'
									? 'cursor-crosshair'
									: 'cursor-default'
							}`}
						/>

						{/* Crop Box Visual Overlay */}
						{cropOverlay && (
							<div
								style={{
									position: 'absolute',
									left: `${cropOverlay.left}px`,
									top: `${cropOverlay.top}px`,
									width: `${cropOverlay.width}px`,
									height: `${cropOverlay.height}px`,
									border: '2px dashed #3B82F6',
									backgroundColor: 'rgba(59, 130, 246, 0.25)',
									pointerEvents: 'none'
								}}
							/>
						)}

						{/* Draggable Movable Text Badges Overlay */}
						{canvasRef.current &&
							textItems.map((item) => {
								const canvas = canvasRef.current;
								if (!canvas) return null;
								const rect = canvas.getBoundingClientRect();
								const scaleX = rect.width / canvas.width;
								const scaleY = rect.height / canvas.height;

								const screenX = item.x * scaleX;
								const screenY = item.y * scaleY;
								const isSelected = item.id === selectedTextId;

								const scaledFontSize = Math.max(12, Math.round(item.fontSize * scaleX));

								return (
									<div
										key={item.id}
										onPointerDown={(e) => handleTextPointerDown(e, item)}
										style={{
											position: 'absolute',
											left: `${screenX}px`,
											top: `${screenY}px`,
											color: item.color,
											fontSize: `${scaledFontSize}px`,
											lineHeight: 1.2
										}}
										className={`group select-none cursor-move px-2.5 py-1 rounded-lg bg-slate-900/80 font-bold shadow-lg transition-all backdrop-blur-xs flex items-center gap-1.5 border border-white/40 ${
											isSelected
												? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-zinc-900 border-white'
												: 'hover:ring-1 hover:ring-white/80'
										}`}
										title="Click and drag to position note anywhere on image"
									>
										<span className="whitespace-nowrap">{item.text}</span>
										{isSelected && (
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteText(item.id);
												}}
												className="ml-1 text-white/70 hover:text-rose-400 p-0.5 cursor-pointer"
												title="Remove note"
											>
												<X className="w-3.5 h-3.5" />
											</button>
										)}
									</div>
								);
							})}
					</div>
				</div>

				{/* Modal Footer */}
				<div className="px-6 py-3.5 border-t border-zinc-200 bg-white flex items-center justify-between">
					<span className="text-[11px] text-zinc-500 flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
						{activeTool === 'pen' && 'Click & drag freely to sketch annotations.'}
						{activeTool === 'arrow' && 'Click and drag an arrow to point directly to a defect.'}
						{activeTool === 'rect' && 'Click and drag a box to highlight an area.'}
						{activeTool === 'crop' && 'Drag a rectangular box over the image and click Apply Crop.'}
						{activeTool === 'text' && 'Type text, click Place Tag, and drag anywhere on the image.'}
					</span>

					<div className="flex items-center gap-2.5">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer border border-zinc-200"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleSave}
							className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#11236a] hover:bg-[#0c1a52] rounded-xl transition-all shadow-md shadow-indigo-900/10 cursor-pointer active:scale-95"
						>
							<Check className="w-4 h-4 stroke-[2.5]" />
							<span>Save & Attach Image</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);

	return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default ImageEditorModal;
