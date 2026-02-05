import clsx from 'clsx';
import { CheckCircle, AlertCircle, RefreshCcw, XCircle } from 'lucide-react';
import { OrderStatus } from '@prisma/client'; // Assuming types are generated

// Manual mapping if Prisma types are tricky to import on client depending on setup
// But usually safe in components if only used as type.
// If strict, we can define a local type matching the one in schema.

interface OrderStatusBadgeProps {
    status: string; // Using string to be permissive, but ideally OrderStatus
    className?: string;
}

export default function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {

    // Normalize casing just in case
    const normStatus = status?.toLowerCase();

    switch (normStatus) {
        case 'paid':
            return (
                <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800", className)}>
                    <CheckCircle size={12} className="mr-1.5" />
                    Payée
                </span>
            );
        case 'refunded':
            return (
                <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800", className)}>
                    <RefreshCcw size={12} className="mr-1.5" />
                    Remboursée
                </span>
            );
        case 'failed':
            return (
                <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800", className)}>
                    <XCircle size={12} className="mr-1.5" />
                    Échec
                </span>
            );
        case 'disputed':
            return (
                <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800", className)}>
                    <AlertCircle size={12} className="mr-1.5" />
                    Litige
                </span>
            );
        default:
            // Handle 'pending' effectively even if not in Enum provided earlier, just in case
            if (normStatus === 'pending') {
                return (
                    <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800", className)}>
                        <AlertCircle size={12} className="mr-1.5" />
                        En attente
                    </span>
                );
            }
            return (
                <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600", className)}>
                    {status}
                </span>
            );
    }
}
