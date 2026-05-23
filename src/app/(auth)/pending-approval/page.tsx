import Link from "next/link";
import { Clock } from "lucide-react";

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-accent mb-4">
            <Clock size={32} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Account Pending Approval
          </h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Thank you for registering with LocalBasket. Your account is currently under review by our administration team. 
          </p>
          <p className="mt-2 text-gray-600 leading-relaxed">
            This usually takes 1-2 business days. We will notify you once your account has been approved.
          </p>
        </div>
        
        <div className="mt-8">
          <Link
            href="/login"
            className="text-brand font-medium hover:text-brand-dark"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
