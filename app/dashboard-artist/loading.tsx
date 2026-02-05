
export default function Loading() {
    return (
        <div className="p-8 bg-black min-h-screen space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center border-b border-white/10 pb-6">
                <div className="space-y-3">
                    <div className="h-8 w-48 bg-white/10 rounded-lg"></div>
                    <div className="h-4 w-32 bg-white/5 rounded-lg"></div>
                </div>
                <div className="h-10 w-32 bg-white/10 rounded-lg"></div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-white/5 rounded-xl border border-white/10 p-6">
                        <div className="h-4 w-24 bg-white/10 rounded mb-4"></div>
                        <div className="h-8 w-16 bg-white/20 rounded"></div>
                    </div>
                ))}
            </div>

            {/* Content Area Skeleton */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
                <div className="h-6 w-36 bg-white/10 rounded mb-6"></div>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center space-x-4 py-3 border-b border-white/5 last:border-0">
                        <div className="h-12 w-12 bg-white/10 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-3/4 bg-white/10 rounded"></div>
                            <div className="h-3 w-1/2 bg-white/5 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
