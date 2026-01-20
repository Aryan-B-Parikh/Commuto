import { Loader2 } from 'lucide-react'

const Loading = ({ text = 'Loading...' }) => {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-primary-500/20"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-transparent border-t-primary-500 animate-spin"></div>
                </div>
                <p className="text-white/60 font-medium">{text}</p>
            </div>
        </div>
    )
}

export default Loading
