"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser, isAuthenticated, login as authLogin } from "../../auth/lib/auth";

export default function SuperAdminLoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [rememberMe, setRememberMe] = useState(true);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!isAuthenticated()) return;

		const currentUser = getCurrentUser();
		if (currentUser?.role === "super_admin") {
			router.replace("/super-admin/manage-tenant");
		}
	}, [router]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);

		if (!email || !password) {
			setError("Vui lòng nhập đủ email và mật khẩu.");
			return;
		}

		setLoading(true);

		try {
			const user = await authLogin({
				company_email: email,
				password,
				remember_me: rememberMe,
			});

			if (user.role !== "super_admin") {
				setError("Tài khoản này không có quyền super admin.");
				return;
			}

			router.replace("/super-admin/manage-tenant");
		} catch (loginError) {
			setError(loginError instanceof Error ? loginError.message : "Đăng nhập thất bại");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="min-h-screen overflow-hidden bg-[#07111f] text-white">
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_30%),linear-gradient(180deg,#07111f_0%,#050b14_100%)]" />
			<div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:72px_72px]" />

			<div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10 lg:px-10">
				<div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr]">
					<section className="flex flex-col justify-between rounded-[2rem] border border-white/10 bg-white/6 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:p-10">
						<div>
							<div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200">
								<span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
								Super Admin Console
							</div>

							<h1 className="mt-8 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
								Điều khiển toàn bộ hệ thống từ một cổng đăng nhập duy nhất.
							</h1>

							<p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
								Quản lý tenant, kiểm soát cấu hình hệ thống và theo dõi trạng thái vận hành với giao diện dành riêng cho super admin.
							</p>
						</div>

						<div className="mt-10 grid gap-4 sm:grid-cols-3">
							<div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
								<div className="text-2xl font-semibold text-white">01</div>
								<div className="mt-2 text-sm text-slate-300">Tenant scope</div>
							</div>
							<div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
								<div className="text-2xl font-semibold text-white">24/7</div>
								<div className="mt-2 text-sm text-slate-300">System control</div>
							</div>
							<div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
								<div className="text-2xl font-semibold text-white">JWT</div>
								<div className="mt-2 text-sm text-slate-300">Secure session</div>
							</div>
						</div>

						<div className="mt-10 flex flex-wrap items-center gap-3 text-sm text-slate-300">
							<span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-200">Tenant-aware</span>
							<span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sky-200">Role checked</span>
							<span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-violet-200">Super admin only</span>
						</div>
					</section>

					<section className="flex items-center justify-center">
						<div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/75 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10">
							<div className="mb-8">
								<p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300/90">Sign in</p>
								<h2 className="mt-3 text-3xl font-semibold text-white">Welcome back, admin.</h2>
								<p className="mt-2 text-sm leading-6 text-slate-400">
									Enter your email and password to access the super admin area.
								</p>
							</div>

							{error && (
								<div className="mb-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
									{error}
								</div>
							)}

							<form className="space-y-5" onSubmit={handleSubmit}>
								<div>
									<label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
										Email
									</label>
									<input
										id="email"
										name="email"
										type="email"
										autoComplete="email"
										value={email}
										onChange={(event) => setEmail(event.target.value)}
										className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:bg-white/8 focus:ring-4 focus:ring-cyan-400/15"
										placeholder="superadmin@company.com"
									/>
								</div>

								<div>
									<label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
										Password
									</label>
									<input
										id="password"
										name="password"
										type="password"
										autoComplete="current-password"
										value={password}
										onChange={(event) => setPassword(event.target.value)}
										className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:bg-white/8 focus:ring-4 focus:ring-cyan-400/15"
										placeholder="••••••••"
									/>
								</div>

								<div className="flex flex-wrap items-center justify-between gap-4">
									<label className="flex items-center gap-3 text-sm text-slate-300">
										<input
											type="checkbox"
											checked={rememberMe}
											onChange={(event) => setRememberMe(event.target.checked)}
											className="h-4 w-4 rounded border-white/20 bg-white/10 text-cyan-400 focus:ring-cyan-400/40"
										/>
										Remember me
									</label>

									<Link href="/auth/login" className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200">
										Regular login
									</Link>
								</div>

								<button
									type="submit"
									disabled={loading}
									className="group inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 px-4 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_16px_40px_rgba(34,211,238,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
								>
									<span>{loading ? "Authenticating..." : "Enter super admin console"}</span>
									<span className="transition group-hover:translate-x-0.5">→</span>
								</button>

								<div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-6 text-slate-400">
									Access is restricted to super admin accounts only. If you are part of a tenant team, use the regular login page.
								</div>
							</form>
						</div>
					</section>
				</div>
			</div>
		</main>
	);
}
