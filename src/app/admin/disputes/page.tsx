"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputes();
  }, []);

  async function fetchDisputes() {
    const supabase = createClient();
    
    // We assume the user has run the SQL migration to create the `disputes` table
    const { data, error } = await supabase
      .from("disputes")
      .select(`
        *,
        orders ( id, total_amount, status ),
        profiles ( full_name, role, phone )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching disputes:", error);
    }

    if (data) setDisputes(data);
    setLoading(false);
  }

  const updateDisputeStatus = async (disputeId: string, newStatus: string) => {
    const supabase = createClient();
    const { error } = await (supabase.from("disputes") as any)
      .update({ status: newStatus })
      .eq("id", disputeId);

    if (!error) {
      setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status: newStatus } : d));
    } else {
      alert("Failed to update dispute status.");
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading disputes...</div>;

  const openDisputes = disputes.filter(d => d.status === 'open');
  const closedDisputes = disputes.filter(d => d.status !== 'open');

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <AlertTriangle size={24} className="mr-2 text-red-500" /> Dispute Handling
        </h1>
        <p className="text-gray-500">Manage user complaints and order disputes.</p>
      </div>

      <div className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          Open Disputes
          <span className="ml-3 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
            {openDisputes.length}
          </span>
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          {openDisputes.length === 0 ? (
            <div className="bg-gray-50 border border-gray-100 border-dashed rounded-xl p-8 text-center text-gray-500 text-sm">
              No open disputes. Great job!
            </div>
          ) : (
            openDisputes.map(dispute => (
              <div key={dispute.id} className="bg-white p-5 rounded-xl border-l-4 border-l-red-500 border-y border-r border-gray-100 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                      {dispute.profiles?.role?.replace('_', ' ')}
                    </span>
                    <span className="font-bold text-gray-900 text-sm">{dispute.profiles?.full_name}</span>
                    <span className="text-xs text-gray-500">{format(new Date(dispute.created_at), "MMM d, yyyy • h:mm a")}</span>
                  </div>
                  
                  <p className="text-gray-800 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3">
                    "{dispute.reason}"
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">Order #{dispute.orders?.id.split('-')[0]}</span>
                    <span>Status: <span className="capitalize">{dispute.orders?.status.replace('_', ' ')}</span></span>
                    <span>Value: ₹{dispute.orders?.total_amount}</span>
                  </div>
                </div>
                
                <div className="flex md:flex-col gap-2 shrink-0">
                  <button 
                    onClick={() => updateDisputeStatus(dispute.id, 'resolved')}
                    className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors text-sm"
                  >
                    <CheckCircle size={16} className="mr-1.5" /> Resolve
                  </button>
                  <button 
                    onClick={() => updateDisputeStatus(dispute.id, 'dismissed')}
                    className="flex-1 bg-gray-50 text-gray-700 hover:bg-gray-100 font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors text-sm"
                  >
                    <XCircle size={16} className="mr-1.5" /> Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          Past Disputes
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
            {closedDisputes.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No past disputes.</div>
            ) : (
              closedDisputes.map(dispute => (
                <div key={dispute.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        dispute.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {dispute.status}
                      </span>
                      <span className="font-bold text-sm text-gray-900">{dispute.profiles?.full_name}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1 max-w-lg">{dispute.reason}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">{format(new Date(dispute.created_at), "MMM d, yyyy")}</p>
                    <p className="text-xs font-semibold text-gray-700 mt-1">Order #{dispute.orders?.id.split('-')[0]}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
