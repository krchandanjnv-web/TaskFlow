"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Suspense } from "react";

const schema = z.object({
  email:    z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type Form = z.infer<typeof schema>;

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") ?? "/dashboard";

  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setServerError(null);
    const result = await signIn("credentials", {
      email:    data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setServerError("Invalid email or password. Please try again.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFAF6] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF8A73] to-[#9B84F7] flex items-center justify-center text-white font-bold text-base">✦</div>
            <span className="font-semibold text-xl" style={{ fontFamily: "'Fraunces', serif" }}>TaskFlow</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#1A1410]">Welcome back</h1>
          <p className="text-sm text-[#9A9490] mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.07] shadow-sm p-8">
          {serverError && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#6B6259] mb-1.5 uppercase tracking-wide">Email</label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-black/10 bg-[#F5F1EC] px-4 py-2.5 text-sm placeholder-[#A89D94] outline-none focus:border-[#9B84F7] focus:ring-2 focus:ring-[#9B84F7]/10 transition-all"
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6B6259] mb-1.5 uppercase tracking-wide">Password</label>
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-black/10 bg-[#F5F1EC] px-4 py-2.5 text-sm placeholder-[#A89D94] outline-none focus:border-[#9B84F7] focus:ring-2 focus:ring-[#9B84F7]/10 transition-all"
              />
              {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center py-3 rounded-xl font-semibold text-sm bg-gradient-to-br from-[#FF8A73] to-[#9B84F7] text-white shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 mt-2"
            >
              {isSubmitting ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#9A9490] mt-6">
          No account?{" "}
          <Link href="/register" className="text-[#5B3FBE] font-semibold hover:underline">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFAF6] flex items-center justify-center"><div className="text-[#9A9490]">Loading…</div></div>}>
      <LoginForm />
    </Suspense>
  );
}
