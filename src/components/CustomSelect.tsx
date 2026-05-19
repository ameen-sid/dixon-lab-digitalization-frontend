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
	const containerRef = useRef<HTMLDivElement>(null);

	const selectedOption = options.find((opt) => opt.value === value);

	// Close on click outside
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

	const handleOptionSelect = (optValue: string) => {
		if (disabled) return;
		onChange(optValue);
		setIsOpen(false);
	};

	return (
		<div ref={containerRef} className={`relative select-none ${className}`}>
			<button
				type="button"
				disabled={disabled}
				onClick={() => setIsOpen(!isOpen)}
				className={`w-full bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 outline-none focus:border-[#11236a] transition-all flex items-center justify-between font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isOpen ? 'border-[#11236a] ring-2 ring-[#11236a]/5' : ''}`}
			>
				<span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
				<ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'transform rotate-180 text-zinc-650' : ''}`} />
			</button>

			{isOpen && (
				<div className="absolute left-0 mt-1 w-full bg-white border border-zinc-250 rounded-[14px] shadow-2xl z-50 py-1.5 max-h-60 overflow-y-auto animate-in fade-in duration-100 origin-top">
					{options.length === 0 ? (
						<div className="px-3 py-2 text-xs text-zinc-400 font-light text-center">No options available</div>
					) : (
						options.map((opt) => {
							const isSelected = opt.value === value;
							return (
								<button
									key={opt.value}
									type="button"
									onClick={() => handleOptionSelect(opt.value)}
									className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer border-none outline-none ${isSelected ? 'bg-[#11236a]/15 text-[#11236a] font-bold' : 'text-zinc-700 hover:bg-zinc-50'}`}
								>
									<span className="truncate">{opt.label}</span>
									{isSelected && (
										<div className="w-1.5 h-1.5 bg-[#11236a] rounded-full shrink-0 ml-2" />
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