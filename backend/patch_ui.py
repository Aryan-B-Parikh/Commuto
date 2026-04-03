import re
import traceback

file_path = "d:/Commuto/frontend/src/app/driver/routes/page.tsx"

try:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Add CounterBidInput import
    if "CounterBidInput" not in content:
        content = content.replace("import { useRouteInfo } from '@/hooks/useRouteInfo';", "import { useRouteInfo } from '@/hooks/useRouteInfo';\nimport CounterBidInput from '@/components/ride/CounterBidInput';")
        content = content.replace("import { bidsAPI } from '@/services/api';", "import { bidsAPI } from '@/services/api';\nimport { useRouter } from 'next/navigation';")

    # 2. Add Handlers to MyBidsPage
    handlers = """
    const router = useRouter();
    const [acceptingId, setAcceptingId] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [counteringId, setCounteringId] = useState<string | null>(null);
    const [counterAmount, setCounterAmount] = useState<string>('');

    const handleAcceptBid = async (bidId: string) => {
        try {
            setAcceptingId(bidId);
            const res = await bidsAPI.acceptBid(bidId);
            showToast('success', 'Counter bid accepted! Trip updated.');
            fetchBids();
            // Optional: redirect to trip details if that exists for drivers, else simply fetch bids
            if (res.trip_id) {
                // Actually drivers usually see their assigned trip in /driver/dashboard
                // Just refreshing is enough
            }
        } catch (error: any) {
            showToast('error', error.response?.data?.detail || 'Failed to accept bid');
        } finally {
            setAcceptingId(null);
        }
    };

    const handleRejectBid = async (bidId: string) => {
        try {
            setRejectingId(bidId);
            await bidsAPI.rejectBid(bidId);
            showToast('success', 'Bid declined.');
            fetchBids();
        } catch (error: any) {
            showToast('error', error.response?.data?.detail || 'Failed to decline bid');
        } finally {
            setRejectingId(null);
        }
    };

    const handleCounterBid = async (bidId: string) => {
        if (!counterAmount || isNaN(Number(counterAmount))) {
            showToast('error', 'Enter a valid amount');
            return;
        }
        try {
            setAcceptingId(bidId); // reuse loading state visually
            await bidsAPI.counterBid(bidId, { amount: Number(counterAmount) });
            showToast('success', 'Counter offer sent successfully');
            setCounteringId(null);
            fetchBids();
        } catch (error: any) {
            showToast('error', error.response?.data?.detail || 'Failed to counter bid');
        } finally {
            setAcceptingId(null);
        }
    };
"""

    if "handleAcceptBid" not in content:
        content = content.replace("    const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');", "    const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');\n" + handlers)

    # 3. Modify DesktopBidCard signature and implementation
    card_props = """{
        bid, statusConfig, tripStatusConfig,
        onAccept, onReject, onCounterClick, onCounterSubmit, onCounterCancel,
        acceptingId, rejectingId, counteringId, counterAmount, setCounterAmount
    }: {
        bid: DriverBidWithTrip, statusConfig: any, tripStatusConfig: any,
        onAccept?: (id: string) => void, onReject?: (id: string) => void,
        onCounterClick?: (id: string) => void, onCounterSubmit?: (id: string) => void,
        onCounterCancel?: () => void, acceptingId?: string | null, rejectingId?: string | null,
        counteringId?: string | null, counterAmount?: string, setCounterAmount?: (v: string) => void
    }"""

    content = re.sub(r'function DesktopBidCard.*?tripStatusConfig: any\n\}\)', "function DesktopBidCard(" + card_props + ")", content, flags=re.DOTALL)
    content = re.sub(r'function MobileBidCard.*?tripStatusConfig: any\n\}\)', "function MobileBidCard(" + card_props + ")", content, flags=re.DOTALL)

    # Update MobileBidCard rendering
    mobile_bid_button_ui = """                <div className="px-4 pb-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1.5 shrink-0">
                        <Navigation2 size={11} className="text-indigo-500" />
                        <span className="text-[11px] font-semibold text-muted-foreground">{distanceKm} km</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1.5 shrink-0">
                        <Users size={11} className="text-indigo-500" />
                        <span className="text-[11px] font-semibold text-muted-foreground">{bid.total_seats} seats</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1.5 shrink-0">
                        <Clock size={11} className="text-indigo-500" />
                        <span className="text-[11px] font-semibold text-muted-foreground">
                            {new Date(bid.start_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {new Date(bid.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>

                {bid.passenger_notes && bid.passenger_notes.length > 0 && (
                    <div className="px-4 pb-4 space-y-1">
                        {bid.passenger_notes.map((pn, idx) => (
                            <div key={idx} className="flex items-start gap-2 bg-muted/20 rounded-lg px-3 py-2 border border-border/30">
                                <MessageSquare size={11} className="text-indigo-400 mt-0.5 shrink-0" />
                                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                    <span className="font-bold text-foreground">{pn.passenger_name}:</span> {pn.notes}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
                
                {bid.is_counter_bid && bid.status === 'pending' && (
                    <div className="px-4 pb-4">
                        {counteringId === bid.id ? (
                            <div className="w-full">
                            <CounterBidInput
                                amount={counterAmount!}
                                setAmount={(e) => setCounterAmount!(e)}
                                isSubmitting={acceptingId === bid.id}
                                onSubmit={() => onCounterSubmit?.(bid.id)}
                                onCancel={onCounterCancel!}
                            /></div>
                        ) : (
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1 bg-emerald-500/10 text-emerald-600 border-none hover:bg-emerald-500/20" 
                                    isLoading={acceptingId === bid.id} onClick={() => onAccept?.(bid.id)}>
                                    Accept
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1 bg-red-500/10 text-red-600 border-none hover:bg-red-500/20" 
                                    isLoading={rejectingId === bid.id} onClick={() => onReject?.(bid.id)}>
                                    Decline
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1" onClick={() => onCounterClick?.(bid.id)}>
                                    Counter
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );"""
    
    # We replace from `<div className="px-4 pb-4 flex items-center ...` all the way to `</motion.div>`
    content = re.sub(r'<div className="px-4 pb-4 flex items-center gap-2 overflow-x-auto no-scrollbar">.*?</div>\n        </motion.div>\n    \);', mobile_bid_button_ui, content, flags=re.DOTALL, count=1)


    # Update DesktopBidCard rendering
    desktop_bid_button_ui = """                    <div className="text-right shrink-0">
                        {bid.is_counter_bid ? (
                           <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Counter Offer</p>
                        ) : (
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Your Bid</p>
                        )}
                        <p className={`text-3xl font-black tracking-tight ${bid.status === 'accepted' ? 'text-emerald-400' :
                            bid.status === 'rejected' ? 'text-red-400 line-through' : 'text-indigo-400'
                            }`}>
                            {formatCurrency(bid.bid_amount)}
                        </p>
                        
                        {bid.is_counter_bid && bid.status === 'pending' && (
                            <div className="mt-4 flex flex-col items-end min-w-[200px]">
                                {counteringId === bid.id ? (
                                    <div className="w-full">
                                    <CounterBidInput
                                        amount={counterAmount!}
                                        setAmount={(e) => setCounterAmount!(e)}
                                        isSubmitting={acceptingId === bid.id}
                                        onSubmit={() => onCounterSubmit?.(bid.id)}
                                        onCancel={onCounterCancel!}
                                    /></div>
                                ) : (
                                    <div className="flex gap-2 w-full mt-2">
                                        <Button size="sm" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" 
                                            isLoading={acceptingId === bid.id} onClick={() => onAccept?.(bid.id)}>
                                            Accept
                                        </Button>
                                        <Button size="sm" variant="outline" className="flex-none text-red-500 hover:text-red-600 border-red-200" 
                                            isLoading={rejectingId === bid.id} onClick={() => onReject?.(bid.id)}>
                                            <XCircle size={16} />
                                        </Button>
                                        <Button size="sm" variant="outline" className="flex-none border-indigo-200" onClick={() => onCounterClick?.(bid.id)}>
                                            Counter
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>"""
    content = re.sub(r'<div className="text-right shrink-0">.*?</p>\n                    </div>', desktop_bid_button_ui, content, flags=re.DOTALL)

    # Add is_counter_bid pill to desktop display
    counter_pill = """                                <span className={`text-[10px] font-bold uppercase tracking-widest ${st.text}`}>
                                    {bid.status}
                                </span>
                            </div>
                            {bid.is_counter_bid && (
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10`}>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest text-amber-500`}>
                                        Counter
                                    </span>
                                </div>
                            )}"""
    content = re.sub(r'<span className={`text-\[10px\] font-bold uppercase tracking-widest \$\{st\.text\}`}>\n                                    \{bid\.status\}\n                                </span>\n                            </div>', counter_pill, content, count=1)

    # Mobile counter pill
    counter_pill_mobile = """                                <span className={`text-[10px] font-bold uppercase tracking-wider ${st.text}`}>
                                {bid.status}
                            </span>
                        </div>
                        {bid.is_counter_bid && (
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10`}>
                                <span className={`text-[10px] font-bold uppercase tracking-wider text-amber-500`}>
                                    Counter
                                </span>
                            </div>
                        )}"""
    content = re.sub(r'<span className={`text-\[10px\] font-bold uppercase tracking-wider \$\{st\.text\}`}>\n                                \{bid\.status\}\n                            </span>\n                        </div>', counter_pill_mobile, content, count=1)

    # Now, update calls to MobileBidCard and DesktopBidCard in MyBidsPage
    common_props = """
                                            statusConfig={statusConfig}
                                            tripStatusConfig={tripStatusConfig}
                                            onAccept={handleAcceptBid}
                                            onReject={handleRejectBid}
                                            onCounterClick={(id) => { setCounteringId(id); setCounterAmount(''); }}
                                            onCounterSubmit={handleCounterBid}
                                            onCounterCancel={() => setCounteringId(null)}
                                            acceptingId={acceptingId}
                                            rejectingId={rejectingId}
                                            counteringId={counteringId}
                                            counterAmount={counterAmount}
                                            setCounterAmount={setCounterAmount}
"""

    content = re.sub(r'statusConfig={statusConfig}\s*tripStatusConfig={tripStatusConfig}', common_props, content)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    print("Patch applied to page.tsx")

except Exception as e:
    print(traceback.format_exc())
