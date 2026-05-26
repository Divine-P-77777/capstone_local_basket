"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, MapPin, Phone, LogOut, Save } from "lucide-react";

export default function CustomerProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login?redirect=/profile");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (data) {
        const profileData = data as any;
        setProfile(profileData);
        setFullName(profileData.full_name || "");
        setAddress(profileData.address || "");
      }
      
      setLoading(false);
    }
    loadProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setSaving(true);
    const supabase = createClient();
    
    const { error } = await (supabase.from("profiles") as any)
      .update({
        full_name: fullName,
        address: address
      })
      .eq("id", profile.id);
      
    if (!error) {
      alert("Profile updated successfully!");
    } else {
      alert("Error updating profile.");
    }
    
    setSaving(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <User size={24} className="mr-2 text-brand" /> My Profile
        </h1>
        <p className="text-gray-500">Manage your personal details and delivery addresses.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <input 
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                placeholder="Enter your full name"
              />
              <User size={18} className="absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Phone Number</label>
            <div className="relative">
              <input 
                type="text"
                value={profile?.phone || ""}
                disabled
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-500 cursor-not-allowed"
              />
              <Phone size={18} className="absolute left-3 top-3.5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400 mt-1">Phone number cannot be changed currently.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Default Delivery Address</label>
            <div className="relative">
              <textarea 
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all min-h-[100px] resize-none"
                placeholder="Enter your full address"
              />
              <MapPin size={18} className="absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              disabled={saving}
              className="w-full bg-brand text-white font-bold py-3.5 rounded-xl flex items-center justify-center shadow-sm hover:bg-brand-dark transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {saving ? "Saving..." : <><Save size={18} className="mr-2" /> Save Profile</>}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-red-50 rounded-2xl border border-red-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-red-900">Logout</h3>
          <p className="text-sm text-red-700">Sign out of your LocalBasket account.</p>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full sm:w-auto bg-white text-red-600 font-bold border border-red-200 py-2.5 px-6 rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} className="mr-2" /> Logout
        </button>
      </div>
    </div>
  );
}
