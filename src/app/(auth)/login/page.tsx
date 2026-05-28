"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ShoppingBasket, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Fetch full profile for role-based routing
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_approved")
        .eq("id", data.user.id)
        .single();

      const userRole = (profile as any)?.role;
      const isApproved = (profile as any)?.is_approved;

      if (userRole === "admin") {
        router.push("/admin/dashboard");
      } else if (userRole === "shop_owner") {
        // Check if the shop is approved before sending to dashboard
        const { data: shopData } = await supabase
          .from("shops")
          .select("is_approved")
          .eq("owner_id", data.user.id)
          .single();

        if ((shopData as any)?.is_approved) {
          router.push("/shop/dashboard");
        } else {
          router.push("/pending-approval");
        }
      } else if (userRole === "delivery_agent") {
        // Delivery agents need admin approval before accessing dashboard
        if (isApproved) {
          router.push("/delivery/dashboard");
        } else {
          router.push("/pending-approval");
        }
      } else {
        // Default: customer
        router.push("/home");
      }
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex w-[420px] shrink-0 flex-col justify-between p-10 bg-gradient-to-br from-brand to-emerald-700 text-white relative overflow-hidden">
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
            Welcome back<br />to LocalBasket.
          </h1>
          <p className="text-white/80 text-base leading-relaxed">
            Your local market, shops, and delivery partners — all in one place.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            "Order from shops near you",
            "Live tracking for every delivery",
            "Secure & fast payments",
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
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
              <ShoppingBasket size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">LocalBasket</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">Sign in</h2>
            <p className="text-gray-500 mt-1.5 text-sm">
              Welcome back! Enter your credentials to continue.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
              <span className="mt-0.5 shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Your password"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-brand to-emerald-600 hover:opacity-90 transition-all duration-200 shadow-sm active:scale-[0.98] disabled:opacity-70 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98] shadow-sm"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0">
              <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
              <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
              <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
              <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-brand hover:text-brand-dark transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
