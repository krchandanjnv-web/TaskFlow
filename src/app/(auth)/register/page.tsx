"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

const schema = z.object({
  name:            z.string().min(2, "Name must be at least 2 characters"),
  email:           z.string().email("Enter a valid email"),
  password:        z.string().min(8, "Password must be at least 8 characters")
                             .regex(/[A-Z]/, "Must include an uppercase letter")
                             .regex(/[0-9]/, "Must include a number"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type Form = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setServerError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setServerError(json.error ?? "Registration failed. Please try again.");
      return;
    }

    // Auto sign-in after registration
    const result = await signIn("credentials", { email: data.email, password: data.password, redirect: false });
    if (result?.error) {
      router.push("/login");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFAF6] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF8A73] to-[#9B84F7] flex items-center justify-center text-white font-bold text-base">✦</div>
            <span className="font-semibold text-xl" style={{ fontFamily: "'Fraunces', serif" }}>TaskFlow</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#1A1410]">Create your account</h1>
          <p className="text-sm text-[#9A9490] mt-1">Free forever · No credit card needed</p>
        </div>

        <div className="card p-8">
          {serverError && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input {...register("name")} type="text" placeholder="Alex Johnson" className="input" />
              {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Email</label>
              <input {...register("email")} type="email" placeholder="you@example.com" className="input" />
              {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input {...register("password")} type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" className="input" />
              {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input {...register("confirmPassword")} type="password" placeholder="••••••••" className="input" />
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full !py-3 text-base mt-2">
              {isSubmitting ? "Creating account…" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#9A9490] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#5B3FBE] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
