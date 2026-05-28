"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ShoppingBasket,
  User,
  Store,
  Bike,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const roles = [
    {
      value: "customer",
      label: "Customer",
      icon: User,
      desc: "Shop locally",
      color: "from-violet-500 to-purple-600",
      bg: "bg-violet-50",
      border: "border-violet-400",
      text: "text-violet-700",
      check: "bg-violet-500",
    },
    {
      value: "shop_owner",
      label: "Shop Owner",
      icon: Store,
      desc: "Sell products",
      color: "from-brand to-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-400",
      text: "text-emerald-700",
      check: "bg-emerald-500",
    },
    {
      value: "delivery_agent",
      label: "Delivery Agent",
      icon: Bike,
      desc: "Earn by delivering",
      color: "from-orange-400 to-amber-500",
      bg: "bg-amber-50",
      border: "border-amber-400",
      text: "text-amber-700",
      check: "bg-amber-500",
    },
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Pass role in metadata so the DB trigger (handle_new_user)
    // reads raw_user_meta_data->>'role' and sets the correct role.
    // Without this, the trigger defaults every new user to 'customer'.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role, // ← critical: read by the handle_new_user trigger
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Upsert profile as a safety net (handles cases where trigger
      // hasn't fired yet or the user already existed)
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName,
        role: role,
      } as any);

      // For shop owners, create a draft shop pending admin approval
      if (role === "shop_owner") {
        await supabase.from("shops").insert({
          owner_id: data.user.id,
          shop_name: `${fullName}'s Shop`,
          address: "Pending",
          location: "POINT(77.0266 28.4595)",
        } as any);
      }

      if (role === "shop_owner" || role === "delivery_agent") {
        router.push("/pending-approval");
      } else {
        router.push("/home");
      }
    }
  };

  const selectedRole = roles.find((r) => r.value === role)!;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Brand Panel */}
      <div
        className={`hidden lg:flex w-[420px] shrink-0 flex-col justify-between p-10 bg-gradient-to-br ${selectedRole.color} text-white relative overflow-hidden transition-all duration-500`}
      >
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-[-80px] left-[-80px] w-[320px] h-[320px] rounded-full bg-white" />
          <div className="absolute bottom-[-60px] right-[-60px] w-[260px] h-[260px] rounded-full bg-white" />
          <div className="absolute top-[40%] right-[-40px] w-[160px] h-[160px] rounded-full bg-white" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <ShoppingBasket size={22} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">LocalBasket</span>
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-4">
            Your local market,<br />at your fingertips.
          </h1>
          <p className="text-white/80 text-base leading-relaxed">
            Connect with nearby shops, get fresh produce delivered, and grow your business with LocalBasket.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            "Free to join, no hidden fees",
            "Live order tracking & realtime updates",
            "Trusted by local businesses",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                <CheckCircle2 size={12} className="text-white" />
              </div>
              <span className="text-sm text-white/90">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-[440px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
              <ShoppingBasket size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">LocalBasket</span>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 bg-brand/10 text-brand text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Sparkles size={12} />
              Free to join
            </div>
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">
              Create an Account
            </h2>
            <p className="text-gray-500 mt-1.5 text-sm">
              Join LocalBasket today — takes less than a minute.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
              <span className="mt-0.5 shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Role Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                I am a
              </label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer group ${
                        isSelected
                          ? `${r.border} ${r.bg} shadow-sm`
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {isSelected && (
                        <div className={`absolute top-2 right-2 w-4 h-4 rounded-full ${r.check} flex items-center justify-center`}>
                          <CheckCircle2 size={10} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all ${
                        isSelected
                          ? `bg-gradient-to-br ${r.color} text-white shadow-sm`
                          : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                      }`}>
                        <Icon size={20} />
                      </div>
                      <span className={`text-xs font-bold leading-tight text-center ${isSelected ? r.text : "text-gray-600"}`}>
                        {r.label}
                      </span>
                      <span className={`text-[10px] mt-0.5 ${isSelected ? r.text + "/70" : "text-gray-400"}`}>
                        {r.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="full-name" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  id="full-name"
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email-address" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  id="email-address"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200 shadow-sm active:scale-[0.98] disabled:opacity-70 bg-gradient-to-r ${selectedRole.color} hover:opacity-90`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-brand hover:text-brand-dark transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
