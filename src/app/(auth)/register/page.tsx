"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ShoppingBasket } from "lucide-react";
import { User, Store, Bike } from "lucide-react";


export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Define role options for card selector
  const roles = [
    { value: "customer", label: "Customer", icon: <User size={32} /> },
    { value: "shop_owner", label: "Shop Owner", icon: <Store size={32} /> },
    { value: "delivery_agent", label: "Delivery Agent", icon: <Bike size={32} /> },
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Sign up user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // 2. Create profile entry
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName,
        role: role,
      } as any);

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      // If they are a shop owner, create a shop entry for approval
      if (role === "shop_owner") {
        await supabase.from("shops").insert({
          owner_id: data.user.id,
          shop_name: `${fullName}'s Shop`,
          address: "Pending", // Needs update later
          location: null, // Needs update
        } as any);
      }




      // Redirect based on role
      if (role === "shop_owner" || role === "delivery_agent") {
        router.push("/pending-approval");
      } else {
        router.push("/home");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-light/20 text-brand">
            <ShoppingBasket size={28} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Create an Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join LocalBasket today
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="block text-sm font-medium leading-6 text-gray-900 mb-1">
                I am a
              </label>
              <div className="flex gap-4 mb-6 justify-center">
                {roles.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`
        flex flex-col items-center p-4 rounded-xl border-2
        ${role === r.value
                        ? "border-brand bg-brand-light/20"
                        : "border-gray-200 bg-white"}
        hover:bg-brand-light/10 transition-all
        w-32
      `}
                  >
                    {r.icon}
                    <span className="mt-2 font-medium text-sm">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="sr-only" htmlFor="full-name">Full Name</label>
              <input
                id="full-name"
                name="fullName"
                type="text"
                required
                className="relative block w-full rounded-lg border-0 py-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand sm:text-sm sm:leading-6 px-3"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="sr-only" htmlFor="email-address">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-lg border-0 py-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand sm:text-sm sm:leading-6 px-3"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="sr-only" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="relative block w-full rounded-lg border-0 py-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand sm:text-sm sm:leading-6 px-3"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-brand px-3 py-3 text-sm font-semibold text-white hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand transition-colors disabled:opacity-70"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
