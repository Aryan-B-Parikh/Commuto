interface CounterBidInputProps {
    bidId: string;
    isActive: boolean;
    counterAmount: string;
    onAmountChange: (value: string) => void;
    isSubmitting: boolean;
    onSubmit: (bidId: string) => void;
    onCancel: () => void;
    size?: 'sm' | 'md';
}

export default function CounterBidInput({
    bidId,
    counterAmount,
    onAmountChange,
    isSubmitting,
    onSubmit,
    onCancel,
    size = 'md',
}: CounterBidInputProps) {
    const isSm = size === 'sm';

    return (
        <div className={`flex ${isSm ? 'flex-wrap items-center' : 'flex-col items-stretch sm:flex-row sm:items-center'} gap-2 w-full`}>
            <input
                type="number"
                value={counterAmount}
                onChange={(e) => onAmountChange(e.target.value)}
                placeholder={isSm ? 'Amount' : 'Your counter amount'}
                className={`
                    ${isSm ? 'w-[88px]' : 'w-full sm:flex-1'}
                    ${isSm ? 'h-8 px-2 text-xs rounded-lg' : 'h-9 px-3 text-sm rounded-xl'}
                    bg-[#1E293B] border border-[#374151] text-[#F9FAFB]
                    placeholder:text-[#6B7280] focus:border-indigo-500 focus:outline-none
                `}
            />
            <div className={`flex items-center gap-2 ${isSm ? 'shrink-0' : 'w-full sm:w-auto'}`}>
                <button
                    type="button"
                    onClick={() => onSubmit(bidId)}
                    disabled={isSubmitting}
                    className={`
                        ${isSm ? 'px-2 h-8 text-xs rounded-lg' : 'flex-1 sm:flex-none px-4 h-9 text-xs rounded-xl'}
                        bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-50
                    `}
                >
                    {isSubmitting ? '...' : 'Send'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className={`
                        ${isSm ? 'px-2 h-8 text-xs rounded-lg' : 'px-3 h-9 text-xs rounded-xl'}
                        bg-[#1E293B] text-[#9CA3AF] font-bold
                    `}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
