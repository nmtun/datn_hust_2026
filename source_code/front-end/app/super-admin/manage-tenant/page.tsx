"use client";

import { useEffect, useMemo, useState } from "react";
import {
	Building2,
	CheckCircle2,
	CircleAlert,
	Clock3,
	Edit2,
	Eye,
	MapPin,
	Mail,
	Phone,
	Plus,
	RotateCcw,
	Search,
	Shield,
	Users,
	Trash2,
	X,
} from "lucide-react";
import Modal from "@/app/components/Modal";
import { withAuth } from "@/app/middleware/withAuth";
import { showToast } from "@/app/utils/toast";
import { tenantApi, TenantPayload, TenantRecord, TenantStatus } from "@/app/api/tenantApi";
import { AdminProfile, userApi } from "@/app/api/userApi";

type TenantForm = {
	tenant_name: string;
	tenant_code: string;
	subdomain: string;
	company_email: string;
	phone_number: string;
	address: string;
	status: TenantStatus;
};

const EMPTY_FORM: TenantForm = {
	tenant_name: "",
	tenant_code: "",
	subdomain: "",
	company_email: "",
	phone_number: "",
	address: "",
	status: "active",
};

const STATUS_META: Record<TenantStatus, { label: string; color: string; icon: React.ReactNode }> = {
	active: { label: "Đang hoạt động", color: "bg-emerald-100 text-emerald-800", icon: <CheckCircle2 className="w-4 h-4" /> },
	inactive: { label: "Tạm dừng", color: "bg-amber-100 text-amber-800", icon: <Clock3 className="w-4 h-4" /> },
	suspended: { label: "Đình chỉ", color: "bg-rose-100 text-rose-800", icon: <CircleAlert className="w-4 h-4" /> },
};

const USER_STATUS_META: Record<AdminProfile["status"], { label: string; color: string }> = {
	active: { label: "Đang hoạt động", color: "bg-emerald-100 text-emerald-800" },
	on_leave: { label: "Nghỉ phép", color: "bg-amber-100 text-amber-800" },
	terminated: { label: "Đã nghỉ", color: "bg-rose-100 text-rose-800" },
};

type TenantAdminRecord = AdminProfile & {
	tenant_id: number | null;
	role: "tenant_admin";
};

type TenantAdminForm = {
	full_name: string;
	personal_email: string;
	company_email: string;
	password: string;
	phone_number: string;
	address: string;
	tenant_id: string;
	status: AdminProfile["status"];
};

const EMPTY_TENANT_ADMIN_FORM: TenantAdminForm = {
	full_name: "",
	personal_email: "",
	company_email: "",
	password: "",
	phone_number: "",
	address: "",
	tenant_id: "",
	status: "active",
};

const formatDate = (value?: string) => (value ? new Date(value).toLocaleString("vi-VN") : "—");

const normalize = (value: string) => value.trim().toLowerCase();

function ManageTenantPage() {
	const [tenants, setTenants] = useState<TenantRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [filterStatus, setFilterStatus] = useState<string>("");
	const [showDeleted, setShowDeleted] = useState(false);

	const [form, setForm] = useState<TenantForm>({ ...EMPTY_FORM });
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingTenant, setEditingTenant] = useState<TenantRecord | null>(null);
	const [saving, setSaving] = useState(false);

	const [viewTenant, setViewTenant] = useState<TenantRecord | null>(null);
	const [deleteTenant, setDeleteTenant] = useState<TenantRecord | null>(null);
	const [restoringTenant, setRestoringTenant] = useState<TenantRecord | null>(null);
	const [submittingDelete, setSubmittingDelete] = useState(false);
	const [submittingRestore, setSubmittingRestore] = useState(false);

	const [tenantAdmins, setTenantAdmins] = useState<TenantAdminRecord[]>([]);
	const [tenantAdminsLoading, setTenantAdminsLoading] = useState(true);
	const [tenantAdminSearch, setTenantAdminSearch] = useState("");
	const [tenantAdminTenantFilter, setTenantAdminTenantFilter] = useState("");
	const [tenantAdminStatusFilter, setTenantAdminStatusFilter] = useState("");
	const [tenantAdminFormOpen, setTenantAdminFormOpen] = useState(false);
	const [tenantAdminSaving, setTenantAdminSaving] = useState(false);
	const [editingTenantAdmin, setEditingTenantAdmin] = useState<TenantAdminRecord | null>(null);
	const [viewTenantAdmin, setViewTenantAdmin] = useState<TenantAdminRecord | null>(null);
	const [tenantAdminForm, setTenantAdminForm] = useState<TenantAdminForm>({ ...EMPTY_TENANT_ADMIN_FORM });

	useEffect(() => {
		fetchTenants({ include_deleted: true });
		fetchTenantAdmins();
	}, []);

	const stats = useMemo(() => {
		const activeCount = tenants.filter((tenant) => !tenant.is_deleted && tenant.status === "active").length;
		const pausedCount = tenants.filter(
			(tenant) => !tenant.is_deleted && (tenant.status === "inactive" || tenant.status === "suspended")
		).length;
		const deletedCount = tenants.filter((tenant) => tenant.is_deleted).length;

		return { total: tenants.length, activeCount, pausedCount, deletedCount };
	}, [tenants]);

	const filteredTenants = useMemo(() => {
		const keyword = normalize(search);

		return tenants.filter((tenant) => {
			const matchesDeletedVisibility = showDeleted || !tenant.is_deleted;
			const matchesStatus = filterStatus ? tenant.status === filterStatus : true;
			const matchesSearch = keyword
				? [tenant.tenant_name, tenant.tenant_code, tenant.subdomain, tenant.company_email, tenant.phone_number, tenant.address]
					  .filter(Boolean)
					  .some((value) => normalize(String(value)).includes(keyword))
				: true;

			return matchesDeletedVisibility && matchesStatus && matchesSearch;
		});
	}, [tenants, search, filterStatus, showDeleted]);

	const tenantOptions = useMemo(() => tenants.filter((tenant) => !tenant.is_deleted), [tenants]);

	const filteredTenantAdmins = useMemo(() => {
		const keyword = normalize(tenantAdminSearch);

		return tenantAdmins.filter((tenantAdmin) => {
			const matchesStatus = tenantAdminStatusFilter ? tenantAdmin.status === tenantAdminStatusFilter : true;
			const matchesTenant = tenantAdminTenantFilter
				? String(tenantAdmin.tenant_id ?? "") === tenantAdminTenantFilter
				: true;
			const matchesSearch = keyword
				? [tenantAdmin.full_name, tenantAdmin.personal_email, tenantAdmin.company_email, tenantAdmin.phone_number, tenantAdmin.address]
						.filter(Boolean)
						.some((value) => normalize(String(value)).includes(keyword))
				: true;

			return matchesStatus && matchesTenant && matchesSearch;
		});
	}, [tenantAdmins, tenantAdminSearch, tenantAdminTenantFilter, tenantAdminStatusFilter]);

	const fetchTenants = async (params?: { search?: string; status?: string; include_deleted?: boolean }) => {
		setLoading(true);
		try {
			const result = await tenantApi.getAll(
				params || {
					include_deleted: showDeleted,
				}
			);

			if (result?.error) {
				showToast.error(result.message || "Không thể tải danh sách tenant");
				setTenants([]);
				return;
			}

			setTenants(result.tenants || []);
		} catch {
			showToast.error("Không thể tải danh sách tenant");
			setTenants([]);
		} finally {
			setLoading(false);
		}
	};

	const fetchTenantAdmins = async () => {
		setTenantAdminsLoading(true);
		try {
			const result = await userApi.getAll({ role: "tenant_admin", include_deleted: true });

			if (result?.error) {
				showToast.error(result.message || "Không thể tải danh sách tenant admin");
				setTenantAdmins([]);
				return;
			}

			setTenantAdmins((result.users || []) as TenantAdminRecord[]);
		} catch {
			showToast.error("Không thể tải danh sách tenant admin");
			setTenantAdmins([]);
		} finally {
			setTenantAdminsLoading(false);
		}
	};

	const handleSearch = () => {
		fetchTenants({
			search: search.trim() || undefined,
			status: filterStatus || undefined,
			include_deleted: true,
		});
	};

	const handleReset = () => {
		setSearch("");
		setFilterStatus("");
		setShowDeleted(false);
		fetchTenants({ include_deleted: true });
	};

	const openCreate = () => {
		setEditingTenant(null);
		setForm({ ...EMPTY_FORM });
		setIsModalOpen(true);
	};

	const openEdit = (tenant: TenantRecord) => {
		setEditingTenant(tenant);
		setForm({
			tenant_name: tenant.tenant_name || "",
			tenant_code: tenant.tenant_code || "",
			subdomain: tenant.subdomain || "",
			company_email: tenant.company_email || "",
			phone_number: tenant.phone_number || "",
			address: tenant.address || "",
			status: tenant.status || "active",
		});
		setIsModalOpen(true);
	};

	const closeForm = () => {
		setIsModalOpen(false);
		setEditingTenant(null);
		setForm({ ...EMPTY_FORM });
	};

	const handleSave = async () => {
		if (!form.tenant_name.trim() || !form.tenant_code.trim() || !form.subdomain.trim() || !form.company_email.trim()) {
			showToast.error("Vui lòng nhập tên tenant, mã tenant, subdomain và email công ty");
			return;
		}

		setSaving(true);
		try {
			const payload: TenantPayload = {
				tenant_name: form.tenant_name.trim(),
				tenant_code: form.tenant_code.trim(),
				subdomain: form.subdomain.trim().toLowerCase(),
				company_email: form.company_email.trim(),
				phone_number: form.phone_number.trim() || undefined,
				address: form.address.trim() || undefined,
				status: form.status,
			};

			const result = editingTenant
				? await tenantApi.update(editingTenant.tenant_id, payload)
				: await tenantApi.create(payload);

			if (result?.error) {
				showToast.error(result.message || (editingTenant ? "Cập nhật tenant thất bại" : "Tạo tenant thất bại"));
				return;
			}

			showToast.success(editingTenant ? "Cập nhật tenant thành công" : "Tạo tenant thành công");
			closeForm();
			fetchTenants({ include_deleted: showDeleted });
		} catch {
			showToast.error("Thao tác tenant thất bại");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteTenant) return;

		setSubmittingDelete(true);
		try {
			const result = await tenantApi.delete(deleteTenant.tenant_id);
			if (result?.error) {
				showToast.error(result.message || "Xóa tenant thất bại");
				return;
			}

			showToast.success("Đã xóa tenant");
			setDeleteTenant(null);
			fetchTenants({ include_deleted: showDeleted });
		} catch {
			showToast.error("Xóa tenant thất bại");
		} finally {
			setSubmittingDelete(false);
		}
	};

	const handleRestore = async () => {
		if (!restoringTenant) return;

		setSubmittingRestore(true);
		try {
			const result = await tenantApi.restore(restoringTenant.tenant_id);
			if (result?.error) {
				showToast.error(result.message || "Khôi phục tenant thất bại");
				return;
			}

			showToast.success("Khôi phục tenant thành công");
			setRestoringTenant(null);
			fetchTenants({ include_deleted: showDeleted });
		} catch {
			showToast.error("Khôi phục tenant thất bại");
		} finally {
			setSubmittingRestore(false);
		}
	};

	const openTenantAdminCreate = () => {
		setEditingTenantAdmin(null);
		setTenantAdminForm({ ...EMPTY_TENANT_ADMIN_FORM });
		setTenantAdminFormOpen(true);
	};

	const openTenantAdminEdit = (tenantAdmin: TenantAdminRecord) => {
		setEditingTenantAdmin(tenantAdmin);
		setTenantAdminForm({
			full_name: tenantAdmin.full_name || "",
			personal_email: tenantAdmin.personal_email || "",
			company_email: tenantAdmin.company_email || "",
			password: "",
			phone_number: tenantAdmin.phone_number || "",
			address: tenantAdmin.address || "",
			tenant_id: tenantAdmin.tenant_id ? String(tenantAdmin.tenant_id) : "",
			status: tenantAdmin.status || "active",
		});
		setTenantAdminFormOpen(true);
	};

	const closeTenantAdminForm = () => {
		setTenantAdminFormOpen(false);
		setEditingTenantAdmin(null);
		setTenantAdminForm({ ...EMPTY_TENANT_ADMIN_FORM });
	};

	const handleTenantAdminSave = async () => {
		if (!tenantAdminForm.full_name.trim() || !tenantAdminForm.personal_email.trim() || !tenantAdminForm.company_email.trim() || !tenantAdminForm.tenant_id.trim()) {
			showToast.error("Vui lòng nhập đầy đủ tên, email cá nhân, email công ty và tenant");
			return;
		}

		if (!editingTenantAdmin && !tenantAdminForm.password.trim()) {
			showToast.error("Vui lòng nhập mật khẩu cho tenant admin mới");
			return;
		}

		setTenantAdminSaving(true);
		try {
			const basePayload = {
				full_name: tenantAdminForm.full_name.trim(),
				personal_email: tenantAdminForm.personal_email.trim(),
				company_email: tenantAdminForm.company_email.trim(),
				phone_number: tenantAdminForm.phone_number.trim() || undefined,
				address: tenantAdminForm.address.trim() || undefined,
				tenant_id: Number(tenantAdminForm.tenant_id),
				status: tenantAdminForm.status,
				role: "tenant_admin" as const,
			};

			const result = editingTenantAdmin
				? await userApi.update(editingTenantAdmin.user_id, {
					...basePayload,
					...(tenantAdminForm.password.trim() ? { password: tenantAdminForm.password.trim() } : {}),
				})
				: await userApi.create({
					...basePayload,
					password: tenantAdminForm.password.trim(),
				});

			if (result?.error) {
				showToast.error(result.message || (editingTenantAdmin ? "Cập nhật tenant admin thất bại" : "Tạo tenant admin thất bại"));
				return;
			}

			showToast.success(editingTenantAdmin ? "Cập nhật tenant admin thành công" : "Tạo tenant admin thành công");
			closeTenantAdminForm();
			fetchTenantAdmins();
		} catch {
			showToast.error("Thao tác tenant admin thất bại");
		} finally {
			setTenantAdminSaving(false);
		}
	};

	const getTenantName = (tenantId?: number | null) => {
		if (!tenantId) return "—";
		return tenants.find((tenant) => tenant.tenant_id === tenantId)?.tenant_name || `#${tenantId}`;
	};

	return (
		<div className="page-container space-y-6 py-4 sm:py-6 lg:py-8">
			<div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
				<div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-cyan-50" />
				<div className="relative grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr] lg:p-8">
					<div>
						<div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
							<Shield className="h-3.5 w-3.5" />
							Super admin
						</div>
						<h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
							Quản lý tenant
						</h1>
						<p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
							Tạo, cập nhật, xóa mềm và khôi phục tenant trong một màn hình. Dữ liệu được lấy trực tiếp từ API quản trị tenant.
						</p>

						<div className="mt-6 flex flex-wrap gap-3">
							<button
								onClick={openCreate}
								className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
							>
								<Plus className="h-4 w-4" />
								Tạo tenant
							</button>
							<button
								onClick={handleReset}
								className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
							>
								Đặt lại bộ lọc
							</button>
						</div>
					</div>

					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
						{[
							{ label: "Tổng tenant", value: stats.total, icon: Building2, tone: "text-slate-900" },
							{ label: "Đang hoạt động", value: stats.activeCount, icon: CheckCircle2, tone: "text-emerald-700" },
							{ label: "Tạm dừng / đình chỉ", value: stats.pausedCount, icon: Clock3, tone: "text-amber-700" },
							{ label: "Đã xóa", value: stats.deletedCount, icon: Trash2, tone: "text-rose-700" },
						].map((item) => {
							const Icon = item.icon;

							return (
								<div key={item.label} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="text-xs font-medium uppercase tracking-wide text-slate-500">
												{item.label}
											</p>
											<p className={`mt-2 text-2xl font-bold ${item.tone}`}>{item.value}</p>
										</div>
										<div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
											<Icon className="h-5 w-5" />
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			<div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
				<div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
					<div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_0.7fr_0.9fr]">
						<div>
							<label className="mb-2 block text-sm font-medium text-slate-700">Tìm kiếm</label>
							<div className="relative">
								<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
								<input
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									onKeyDown={(event) => event.key === "Enter" && handleSearch()}
									placeholder="Tên tenant, mã, subdomain, email, số điện thoại, địa chỉ"
									className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-400"
								/>
							</div>
						</div>

						<div>
							<label className="mb-2 block text-sm font-medium text-slate-700">Trạng thái</label>
							<select
								value={filterStatus}
								onChange={(event) => setFilterStatus(event.target.value)}
								className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400"
							>
								<option value="">Tất cả</option>
								<option value="active">Đang hoạt động</option>
								<option value="inactive">Tạm dừng</option>
								<option value="suspended">Đình chỉ</option>
							</select>
						</div>

						<div className="flex items-end gap-3">
							<label className="flex h-[42px] flex-1 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700">
								<input
									type="checkbox"
									checked={showDeleted}
									onChange={(event) => setShowDeleted(event.target.checked)}
									className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
								/>
								Hiển thị tenant đã xóa
							</label>
						</div>
					</div>

					<div className="flex gap-3">
						<button
							onClick={handleSearch}
							className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
						>
							Tìm kiếm
						</button>
						<button
							onClick={handleReset}
							className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
						>
							Xóa lọc
						</button>
					</div>
				</div>
			</div>

			<div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
				{loading ? (
					<div className="flex items-center justify-center p-12">
						<div className="h-10 w-10 animate-spin rounded-full border-b-2 border-slate-900" />
					</div>
				) : filteredTenants.length === 0 ? (
					<div className="p-12 text-center">
						<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
							<Building2 className="h-7 w-7" />
						</div>
						<p className="text-base font-semibold text-slate-900">Không có tenant phù hợp</p>
						<p className="mt-1 text-sm text-slate-500">Hãy đổi bộ lọc hoặc tạo tenant mới.</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-slate-200">
							<thead className="bg-slate-50">
								<tr>
									{[
										"Tenant",
										"Liên hệ",
										"Trạng thái",
										"Thời gian",
										"Hành động",
									].map((label) => (
										<th
											key={label}
											className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
										>
											{label}
										</th>
									))}
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-200 bg-white">
								{filteredTenants.map((tenant) => {
									const statusMeta = STATUS_META[tenant.status];
									const isDeleted = Boolean(tenant.is_deleted);

									return (
										<tr key={tenant.tenant_id} className={`transition hover:bg-slate-50 ${isDeleted ? "bg-rose-50/40" : ""}`}>
											<td className="px-5 py-4 align-top">
												<div className="flex items-start gap-3">
													<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
														<Building2 className="h-5 w-5" />
													</div>
													<div>
														<div className="flex flex-wrap items-center gap-2">
															<p className="text-sm font-semibold text-slate-900">{tenant.tenant_name}</p>
															{isDeleted && (
																<span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
																	Đã xóa
																</span>
															)}
														</div>
														<p className="mt-1 text-xs text-slate-500">Mã: {tenant.tenant_code}</p>
														<p className="mt-1 text-xs text-slate-500">Subdomain: {tenant.subdomain}</p>
													</div>
												</div>
											</td>
											<td className="px-5 py-4 align-top">
												<p className="inline-flex items-center gap-2 text-sm text-slate-700">
													<Mail className="h-4 w-4 text-slate-400" />
													{tenant.company_email}
												</p>
												<p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-700">
													<Phone className="h-4 w-4 text-slate-400" />
													{tenant.phone_number || "—"}
												</p>
												<p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-500">
													<MapPin className="h-4 w-4 text-slate-400" />
													{tenant.address || "—"}
												</p>
											</td>
											<td className="px-5 py-4 align-top">
												<span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.color}`}>
													{statusMeta.icon}
													{statusMeta.label}
												</span>
											</td>
											<td className="px-5 py-4 align-top text-sm text-slate-600">
												<p>Tạo: {formatDate(tenant.created_at)}</p>
												<p className="mt-1">Cập nhật: {formatDate(tenant.updated_at)}</p>
											</td>
											<td className="px-5 py-4 align-top">
												<div className="flex flex-wrap gap-2">
													<button
														onClick={() => setViewTenant(tenant)}
														className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
													>
														<Eye className="h-4 w-4" />
														Xem
													</button>
													{!isDeleted ? (
														<>
															<button
																onClick={() => openEdit(tenant)}
																className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
															>
																<Edit2 className="h-4 w-4" />
																Sửa
															</button>
															<button
																onClick={() => setDeleteTenant(tenant)}
																className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
															>
																<Trash2 className="h-4 w-4" />
																Xóa
															</button>
														</>
													) : (
														<button
															onClick={() => setRestoringTenant(tenant)}
															className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
														>
															<RotateCcw className="h-4 w-4" />
															Khôi phục
														</button>
													)}
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>

			<Modal
				isOpen={isModalOpen}
				onClose={closeForm}
				title={editingTenant ? "Cập nhật tenant" : "Tạo tenant mới"}
			>
				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">Tên tenant</label>
						<input
							value={form.tenant_name}
							onChange={(event) => setForm((current) => ({ ...current, tenant_name: event.target.value }))}
							className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
							placeholder="Ví dụ: DATN Human Resources"
						/>
					</div>
					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">Mã tenant</label>
						<input
							value={form.tenant_code}
							onChange={(event) => setForm((current) => ({ ...current, tenant_code: event.target.value }))}
							className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
							placeholder="Ví dụ: DATN-HR"
						/>
					</div>
					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">Subdomain</label>
						<input
							value={form.subdomain}
							onChange={(event) => setForm((current) => ({ ...current, subdomain: event.target.value }))}
							className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
							placeholder="Ví dụ: datn-hr"
						/>
					</div>
					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">Email công ty</label>
						<input
							type="email"
							value={form.company_email}
							onChange={(event) => setForm((current) => ({ ...current, company_email: event.target.value }))}
							className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
							placeholder="contact@company.com"
						/>
					</div>
					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">Số điện thoại</label>
						<input
							value={form.phone_number}
							onChange={(event) => setForm((current) => ({ ...current, phone_number: event.target.value }))}
							className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
							placeholder="0900000000"
						/>
					</div>
					<div className="md:col-span-2">
						<label className="mb-2 block text-sm font-medium text-slate-700">Địa chỉ</label>
						<input
							value={form.address}
							onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
							className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
							placeholder="Hanoi, Vietnam"
						/>
					</div>
					<div className="md:col-span-2">
						<label className="mb-2 block text-sm font-medium text-slate-700">Trạng thái</label>
						<select
							value={form.status}
							onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as TenantStatus }))}
							className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
						>
							<option value="active">Đang hoạt động</option>
							<option value="inactive">Tạm dừng</option>
							<option value="suspended">Đình chỉ</option>
						</select>
					</div>
				</div>

				<div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
					<button
						onClick={closeForm}
						className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
					>
						<X className="h-4 w-4" />
						Hủy
					</button>
					<button
						onClick={handleSave}
						disabled={saving}
						className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{saving ? "Đang lưu..." : editingTenant ? "Cập nhật" : "Tạo mới"}
					</button>
				</div>
			</Modal>

			<Modal
				isOpen={Boolean(viewTenant)}
				onClose={() => setViewTenant(null)}
				title="Chi tiết tenant"
			>
				{viewTenant && (
					<div className="space-y-4">
						<div className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4">
							<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
								<Building2 className="h-6 w-6" />
							</div>
							<div>
								<h3 className="text-lg font-semibold text-slate-900">{viewTenant.tenant_name}</h3>
								<p className="text-sm text-slate-500">Mã tenant: {viewTenant.tenant_code}</p>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							{[
								["Email công ty", viewTenant.company_email],
								["Số điện thoại", viewTenant.phone_number || "—"],
								["Địa chỉ", viewTenant.address || "—"],
								["Subdomain", viewTenant.subdomain],
								["Trạng thái", STATUS_META[viewTenant.status]?.label || viewTenant.status],
								["Tạo lúc", formatDate(viewTenant.created_at)],
								["Cập nhật lúc", formatDate(viewTenant.updated_at)],
							].map(([label, value]) => (
								<div key={label} className="rounded-2xl border border-slate-200 p-4">
									<p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
									<p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
								</div>
							))}
						</div>
					</div>
				)}
			</Modal>

			<Modal
				isOpen={Boolean(deleteTenant)}
				onClose={() => setDeleteTenant(null)}
				title="Xác nhận xóa tenant"
			>
				{deleteTenant && (
					<div>
						<p className="text-sm text-slate-700">
							Tenant <span className="font-semibold text-slate-900">{deleteTenant.tenant_name}</span> sẽ được xóa mềm. Bạn có thể khôi phục lại sau.
						</p>
						<div className="mt-5 flex justify-end gap-3">
							<button
								onClick={() => setDeleteTenant(null)}
								className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
							>
								Hủy
							</button>
							<button
								onClick={handleDelete}
								disabled={submittingDelete}
								className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{submittingDelete ? "Đang xóa..." : "Xóa tenant"}
							</button>
						</div>
					</div>
				)}
			</Modal>

			<Modal
				isOpen={Boolean(restoringTenant)}
				onClose={() => setRestoringTenant(null)}
				title="Khôi phục tenant"
			>
				{restoringTenant && (
					<div>
						<p className="text-sm text-slate-700">
							Khôi phục tenant <span className="font-semibold text-slate-900">{restoringTenant.tenant_name}</span> về trạng thái hoạt động?
						</p>
						<div className="mt-5 flex justify-end gap-3">
							<button
								onClick={() => setRestoringTenant(null)}
								className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
							>
								Hủy
							</button>
							<button
								onClick={handleRestore}
								disabled={submittingRestore}
								className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{submittingRestore ? "Đang khôi phục..." : "Khôi phục"}
							</button>
						</div>
					</div>
				)}
			</Modal>

			<div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
				<div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
					<div>
						<div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
							<Users className="h-3.5 w-3.5" />
							Tenant admin
						</div>
						<h2 className="mt-3 text-xl font-semibold text-slate-900">Quản lý tenant admin</h2>
						<p className="mt-1 text-sm text-slate-500">Xem, thêm và chỉnh sửa tài khoản quản trị theo từng tenant.</p>
					</div>

					<button
						onClick={openTenantAdminCreate}
						className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
					>
						<Plus className="h-4 w-4" />
						Thêm tenant admin
					</button>
				</div>

				<div className="mt-5 grid gap-3 md:grid-cols-3">
					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">Tìm kiếm</label>
						<div className="relative">
							<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
							<input
								value={tenantAdminSearch}
								onChange={(event) => setTenantAdminSearch(event.target.value)}
								placeholder="Tên, email, số điện thoại..."
								className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
							/>
						</div>
					</div>

					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">Tenant</label>
						<select
							value={tenantAdminTenantFilter}
							onChange={(event) => setTenantAdminTenantFilter(event.target.value)}
							className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
						>
							<option value="">Tất cả tenant</option>
							{tenantOptions.map((tenant) => (
								<option key={tenant.tenant_id} value={tenant.tenant_id}>
									{tenant.tenant_name}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">Trạng thái</label>
						<select
							value={tenantAdminStatusFilter}
							onChange={(event) => setTenantAdminStatusFilter(event.target.value)}
							className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
						>
							<option value="">Tất cả</option>
							<option value="active">Đang hoạt động</option>
							<option value="on_leave">Nghỉ phép</option>
							<option value="terminated">Đã nghỉ</option>
						</select>
					</div>
				</div>

				<div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
					{tenantAdminsLoading ? (
						<div className="flex items-center justify-center p-10">
							<div className="h-10 w-10 animate-spin rounded-full border-b-2 border-slate-900" />
						</div>
					) : filteredTenantAdmins.length === 0 ? (
						<div className="p-10 text-center text-sm text-slate-500">Không có tenant admin phù hợp</div>
					) : (
						<table className="min-w-full divide-y divide-slate-200">
							<thead className="bg-slate-50">
								<tr>
									{["Họ tên", "Liên hệ", "Tenant", "Trạng thái", "Hành động"].map((label) => (
										<th key={label} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
											{label}
										</th>
									))}
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-200 bg-white">
								{filteredTenantAdmins.map((tenantAdmin) => {
									const statusMeta = USER_STATUS_META[tenantAdmin.status] || USER_STATUS_META.active;
									return (
										<tr key={tenantAdmin.user_id} className="hover:bg-slate-50">
											<td className="px-5 py-4 align-top">
												<p className="text-sm font-semibold text-slate-900">{tenantAdmin.full_name}</p>
												<p className="mt-1 text-xs text-slate-500">#{tenantAdmin.user_id}</p>
											</td>
											<td className="px-5 py-4 align-top text-sm text-slate-700">
												<p>{tenantAdmin.personal_email}</p>
												<p className="mt-1 text-slate-500">{tenantAdmin.company_email || "—"}</p>
												<p className="mt-1 text-slate-500">{tenantAdmin.phone_number || "—"}</p>
											</td>
											<td className="px-5 py-4 align-top text-sm text-slate-700">
												<p>{getTenantName(tenantAdmin.tenant_id)}</p>
												<p className="mt-1 text-xs text-slate-500">{tenantAdmin.address || "—"}</p>
											</td>
											<td className="px-5 py-4 align-top">
												<span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.color}`}>
													{statusMeta.label}
												</span>
											</td>
											<td className="px-5 py-4 align-top">
												<div className="flex flex-wrap gap-2">
													<button
														onClick={() => setViewTenantAdmin(tenantAdmin)}
														className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
													>
														<Eye className="h-4 w-4" />
														Xem
													</button>
													<button
														onClick={() => openTenantAdminEdit(tenantAdmin)}
														className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
													>
														<Edit2 className="h-4 w-4" />
														Sửa
													</button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)}
				</div>
			</div>

			<Modal
				isOpen={tenantAdminFormOpen}
				onClose={closeTenantAdminForm}
				title={editingTenantAdmin ? "Cập nhật tenant admin" : "Tạo tenant admin mới"}
			>
				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">Họ và tên</label>
						<input
							value={tenantAdminForm.full_name}
							onChange={(event) => setTenantAdminForm((current) => ({ ...current, full_name: event.target.value }))}
							className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
						/>
					</div>
					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">Tenant</label>
						<select
							value={tenantAdminForm.tenant_id}
							onChange={(event) => setTenantAdminForm((current) => ({ ...current, tenant_id: event.target.value }))}
							className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
						>
							<option value="">Chọn tenant</option>
							{tenantOptions.map((tenant) => (
								<option key={tenant.tenant_id} value={tenant.tenant_id}>
									{tenant.tenant_name}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">Email cá nhân</label>
						<input
							type="email"
							value={tenantAdminForm.personal_email}
							onChange={(event) => setTenantAdminForm((current) => ({ ...current, personal_email: event.target.value }))}
							className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
						/>
					</div>
					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">Email công ty</label>
						<input
							type="email"
							value={tenantAdminForm.company_email}
							onChange={(event) => setTenantAdminForm((current) => ({ ...current, company_email: event.target.value }))}
							className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
						/>
					</div>
					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">Mật khẩu {editingTenantAdmin ? "(để trống nếu không đổi)" : ""}</label>
						<input
							type="password"
							value={tenantAdminForm.password}
							onChange={(event) => setTenantAdminForm((current) => ({ ...current, password: event.target.value }))}
							className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
						/>
					</div>
					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">Số điện thoại</label>
						<input
							value={tenantAdminForm.phone_number}
							onChange={(event) => setTenantAdminForm((current) => ({ ...current, phone_number: event.target.value }))}
							className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
						/>
					</div>
					<div>
						<label className="mb-2 block text-sm font-medium text-slate-700">Trạng thái</label>
						<select
							value={tenantAdminForm.status}
							onChange={(event) => setTenantAdminForm((current) => ({ ...current, status: event.target.value as AdminProfile["status"] }))}
							className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
						>
							<option value="active">Đang hoạt động</option>
							<option value="on_leave">Nghỉ phép</option>
							<option value="terminated">Đã nghỉ</option>
						</select>
					</div>
					<div className="md:col-span-2">
						<label className="mb-2 block text-sm font-medium text-slate-700">Địa chỉ</label>
						<input
							value={tenantAdminForm.address}
							onChange={(event) => setTenantAdminForm((current) => ({ ...current, address: event.target.value }))}
							className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
						/>
					</div>
				</div>

				<div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
					<button
						onClick={closeTenantAdminForm}
						className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
					>
						<X className="h-4 w-4" />
						Hủy
					</button>
					<button
						onClick={handleTenantAdminSave}
						disabled={tenantAdminSaving}
						className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{tenantAdminSaving ? "Đang lưu..." : editingTenantAdmin ? "Cập nhật" : "Tạo mới"}
					</button>
				</div>
			</Modal>

			<Modal isOpen={Boolean(viewTenantAdmin)} onClose={() => setViewTenantAdmin(null)} title="Chi tiết tenant admin">
				{viewTenantAdmin && (
					<div className="space-y-4">
						<div className="rounded-2xl bg-slate-50 p-4">
							<h3 className="text-lg font-semibold text-slate-900">{viewTenantAdmin.full_name}</h3>
							<p className="mt-1 text-sm text-slate-500">Tenant: {getTenantName(viewTenantAdmin.tenant_id)}</p>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							{[
								["Email cá nhân", viewTenantAdmin.personal_email],
								["Email công ty", viewTenantAdmin.company_email || "—"],
								["Số điện thoại", viewTenantAdmin.phone_number || "—"],
								["Địa chỉ", viewTenantAdmin.address || "—"],
								["Trạng thái", USER_STATUS_META[viewTenantAdmin.status]?.label || viewTenantAdmin.status],
							].map(([label, value]) => (
								<div key={label} className="rounded-2xl border border-slate-200 p-4">
									<p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
									<p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
								</div>
							))}
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
}

export default withAuth(ManageTenantPage);
