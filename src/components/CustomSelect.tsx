import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
	value: string;
	label: string;
}

interface CustomSelectProps {
	value: string;
	onChange: (value: string) => void;
	options: SelectOption[];
	disabled?: boolean;
	placeholder?: string;
	className?: string;
}

export default function CustomSelect({value, onChange, options, disabled = false, placeholder = 'Select option...', className = ''}: CustomSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	const selectedOption = options.find((opt) => opt.value === value);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	useEffect(() => {
		if (isOpen) {
			const index = options.findIndex((opt) => opt.value === value);
			setHighlightedIndex(index !== -1 ? index : 0);
		} else {
			setHighlightedIndex(-1);
		}
	}, [isOpen, value, options]);

	useEffect(() => {
		if (isOpen && highlightedIndex !== -1 && listRef.current) {
			const listEl = listRef.current;
			const activeEl = listEl.children[highlightedIndex] as HTMLElement;
			if (activeEl) {
				activeEl.scrollIntoView({ block: 'nearest' });
			}
		}
	}, [highlightedIndex, isOpen]);

	const handleOptionSelect = (optValue: string) => {
		if (disabled) return;
		onChange(optValue);
		setIsOpen(false);
		triggerRef.current?.focus();
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (disabled) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				if (!isOpen) {
					setIsOpen(true);
				} else if (options.length > 0) {
					setHighlightedIndex((prev) => (prev + 1) % options.length);
				}
				break;
			case 'ArrowUp':
				event.preventDefault();
				if (!isOpen) {
					setIsOpen(true);
				} else if (options.length > 0) {
					setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
				}
				break;
			case 'Enter':
			case ' ': // Space
				if (isOpen) {
					event.preventDefault();
					if (highlightedIndex >= 0 && highlightedIndex < options.length) {
						handleOptionSelect(options[highlightedIndex].value);
					}
				}
				break;
			case 'Escape':
				if (isOpen) {
					event.preventDefault();
					setIsOpen(false);
					triggerRef.current?.focus();
				}
				break;
			case 'Tab':
				if (isOpen) {
					setIsOpen(false);
				}
				break;
			default:
				break;
		}
	};

	return (
		<div
			ref={containerRef}
			className={`relative select-none ${className}`}
			onKeyDown={handleKeyDown}
		>
			<button
				ref={triggerRef}
				type="button"
				disabled={disabled}
				title={selectedOption ? selectedOption.label : placeholder}
				onClick={() => setIsOpen(!isOpen)}
				className={`w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all flex items-center justify-between font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isOpen ? 'border-[#11236a] ring-2 ring-[#11236a]/5' : ''}`}
			>
				<span className={`truncate ${selectedOption ? 'font-bold text-zinc-900' : 'text-zinc-650'}`}>
					{selectedOption ? selectedOption.label : placeholder}
				</span>
				<ChevronDown className={`w-4 h-4 text-zinc-700 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'transform rotate-180 text-zinc-900' : ''}`} />
			</button>

			{isOpen && (
				<div
					ref={listRef}
					className="absolute left-0 mt-1 min-w-full w-max max-w-lg bg-white border border-zinc-250 rounded-[14px] shadow-2xl z-50 py-1.5 max-h-60 overflow-y-auto animate-in fade-in duration-100 origin-top"
				>
					{options.length === 0 ? (
						<div className="px-3 py-2 text-xs text-zinc-700 font-bold text-center">No options available</div>
					) : (
						options.map((opt, idx) => {
							const isSelected = opt.value === value;
							const isHighlighted = idx === highlightedIndex;

							let bgClass = '';
							if (isSelected) {
								bgClass = isHighlighted ? 'bg-[#11236a]/20 text-[#11236a] font-extrabold' : 'bg-[#11236a]/15 text-[#11236a] font-extrabold';
							} else {
								bgClass = isHighlighted ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-800 font-bold hover:bg-zinc-50';
							}

							return (
								<button
									key={opt.value}
									type="button"
									tabIndex={-1}
									title={opt.label}
									onClick={() => handleOptionSelect(opt.value)}
									onMouseEnter={() => setHighlightedIndex(idx)}
									className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer border-none outline-none ${bgClass}`}
								>
									<span className="whitespace-normal break-wrap-break-word leading-tight">{opt.label}</span>
									{isSelected && (
										<div className="w-1.5 h-1.5 bg-[#11236a] rounded-full shrink-0 ml-2.5" />
									)}
								</button>
							);
						})
					)}
				</div>
			)}
		</div>
	);
}