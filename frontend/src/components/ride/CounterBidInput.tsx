/**
 * CounterBidInput – reusable counter-offer form for bid cards.
 *
 * Extracted from duplicate implementations in:
 *   – passenger/ride-details/[id]/page.tsx
 *   – passenger/trip/[id]/page.tsx
 *
 * The parent component owns all state and business logic; this component
 * only handles UI rendering, keeping the logic-transport split clean.
 */
interface CounterBidInputProps {
    /** The bid being countered – used as the key for "active" state. */
    bidId: string;
    /** Whether this counter-bid form is currently expanded for `bidId`. */
    isActive: boolean;
    /** Current text value of the counter-amount input. */
    counterAmount: string;
    /** Called whenever the input value changes. */
    onAmountChange: (value: string) => void;
    /** Whether a counter-bid network request is in flight. */
    isSubmitting: boolean;
    /** Called when the user confirms the counter offer. */
    onSubmit: (bidId: string) => void;
    /** Called when the user dismisses the counter form. */
    onCancel: () => void;
    /** Tailwind size variant – compact for mobile, default for desktop. */
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
        <div className="flex items-center gap-1">
            <input
                type="number"
                value={counterAmount}
                onChange={(e) => onAmountChange(e.target.value)}
                placeholder={isSm ? 'Amount' : 'Your counter amount'}
                className={`
                    ${isSm ? 'w-20' : 'flex-1'}
                    ${isSm ? 'h-8 px-2 text-xs rounded-lg' : 'h-9 px-3 text-sm rounded-xl'}
                    bg-[#1E293B] border border-[#374151] text-[#F9FAFB]
                    placeholder:text-[#6B7280] focus:border-indigo-500 focus:outline-none
                `}
            />
            <button
                type="button"
                onClick={() => onSubmit(bidId)}
                disabled={isSubmitting}
                className={`
                    ${isSm ? 'px-2 h-8 text-xs rounded-lg' : 'px-4 h-9 text-xs rounded-xl'}
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
                ✕
            </button>
        </div>
    );
}
