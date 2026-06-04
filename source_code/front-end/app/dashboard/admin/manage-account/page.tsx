"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
	Search,
	User,
	Mail,
	Shield,
	Phone,
	MapPin,
	Plus,
	Eye,
	Edit2,
	Trash2,
	Save,
	X,
	Lock,
} from "lucide-react";
import { userApi, AdminProfile, AdminUserCreatePayload } from "@/app/api/userApi";
import { showToast } from "@/app/utils/toast";
import Modal from "@/app/components/Modal";
import { withAuth } from "@/app/middleware/withAuth";
import { useAuth } from "@/app/context/AuthContext";

type AccountForm = {
	full_name: string;
	personal_email: string;
	company_email: string;
	password: string;
	phone_number: string;
	address: string;
	position: string;
	role: AdminUserCreatePayload["role"];
	status: NonNullable<AdminUserCreatePayload["status"]>;
};

const EMPTY_FORM: AccountForm = {
	full_name: "",
	personal_email: "",
	company_email: "",
	password: "",
	phone_number: "",
	address: "",
	position: "",
	role: "employee",
	status: "active",
};

const ROLE_LABELS: Record<string, string> = {
	manager: "Quản lý",
	hr: "HR",
	employee: "Nhân viên",
	candidate: "Ứng viên",
};

const ROLE_COLORS: Record<string, string> = {
	manager: "bg-blue-100 text-blue-800",
	hr: "bg-emerald-100 text-emerald-800",
	employee: "bg-gray-100 text-gray-800",
	candidate: "bg-orange-100 text-orange-800",
};

const STATUS_META: Record<string, { label: string; color: string }> = {
	active: { label: "Đang làm", color: "bg-green-100 text-green-800" },
	on_leave: { label: "Nghỉ phép", color: "bg-yellow-100 text-yellow-800" },
	terminated: { label: "Đã nghỉ", color: "bg-red-100 text-red-800" },
};

const formatDate = (value?: string) =>
	value ? new Date(value).toLocaleDateString("vi-VN") : "—";

function ManageAccountPage() {
	const { user: currentUser } = useAuth();
	const [accounts, setAccounts] = useState<AdminProfile[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchName, setSearchName] = useState("");
	const [searchEmail, setSearchEmail] = useState("");
	const [filterRole, setFilterRole] = useState("");
	const [filterStatus, setFilterStatus] = useState("");

	const [viewAccount, setViewAccount] = useState<AdminProfile | null>(null);
	const [editingAccount, setEditingAccount] = useState<AdminProfile | null>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [form, setForm] = useState<AccountForm>({ ...EMPTY_FORM });
	const [saving, setSaving] = useState(false);

	const [deleteModal, setDeleteModal] = useState(false);
	const [accountToDelete, setAccountToDelete] = useState<AdminProfile | null>(null);
	const [deleting, setDeleting] = useState(false);

	const visibleAccounts = useMemo(
		() => accounts.filter((account) => account.role !== "candidate" && account.role !== "tenant_admin"),
		[accounts]
	);

	useEffect(() => {
		fetchAccounts();
	}, []);

	const buildQuery = () => ({
		full_name: searchName.trim() || undefined,
		email: searchEmail.trim() || undefined,
		role: filterRole || undefined,
		status: filterStatus || undefined,
	});

	const fetchAccounts = async (params?: {
		full_name?: string;
		email?: string;
		role?: string;
		status?: string;
	}) => {
		setLoading(true);
		try {
			const result = await userApi.getAll(params);
			if (result?.error) {
				showToast.error(result.message || "Không thể tải danh sách tài khoản");
				setAccounts([]);
				return;
			}
			setAccounts(result.users || []);
		} catch {
			showToast.error("Không thể tải danh sách tài khoản");
			setAccounts([]);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = () => {
		fetchAccounts(buildQuery());
	};

	const handleReset = () => {
		setSearchName("");
		setSearchEmail("");
		setFilterRole("");
		setFilterStatus("");
		fetchAccounts();
	};

	const openCreate = () => {
		setEditingAccount(null);
		setForm({ ...EMPTY_FORM });
		setModalOpen(true);
	};

	const openEdit = (account: AdminProfile) => {
		setEditingAccount(account);
		setForm({
			full_name: account.full_name || "",
			personal_email: account.personal_email || "",
			company_email: account.company_email || "",
			password: "",
			phone_number: account.phone_number || "",
			address: account.address || "",
			position: "",
			role: (account.role as AccountForm["role"]) || "employee",
			status: (account.status as AccountForm["status"]) || "active",
		});
		setModalOpen(true);
	};

	const handleSave = async () => {
		if (!form.full_name.trim() || !form.personal_email.trim()) {
			showToast.error("Vui lòng nhập họ tên và email cá nhân");
			return;
		}

		if (!editingAccount && !form.password.trim()) {
			showToast.error("Vui lòng nhập mật khẩu");
			return;
		}

		setSaving(true);
		try {
			if (editingAccount) {
				const payload: Partial<AdminProfile & { password?: string }> = {
					full_name: form.full_name.trim(),
					personal_email: form.personal_email.trim(),
					  company_email: form.company_email.trim(),
					phone_number: form.phone_number.trim() || undefined,
					address: form.address.trim() || undefined,
					role: form.role,
					status: form.status,
				};
				if (form.password.trim()) {
					payload.password = form.password.trim();
				}

				const result = await userApi.update(editingAccount.user_id, payload);
				if (result?.error) {
					showToast.error(result.message || "Cập nhật tài khoản thất bại");
					return;
				}
				showToast.success("Cập nhật tài khoản thành công");
			} else {
				const payload: AdminUserCreatePayload = {
					full_name: form.full_name.trim(),
					personal_email: form.personal_email.trim(),
					password: form.password.trim(),
					role: form.role,
					status: form.status,
					company_email: form.company_email.trim() || undefined,
					phone_number: form.phone_number.trim() || undefined,
					address: form.address.trim() || undefined,
					position: form.position.trim() || undefined,
				};

				const result = await userApi.create(payload);
				if (result?.error) {
					showToast.error(result.message || "Tạo tài khoản thất bại");
					return;
				}
				showToast.success("Tạo tài khoản thành công");
			}

			setModalOpen(false);
			setEditingAccount(null);
			setForm({ ...EMPTY_FORM });
			fetchAccounts(buildQuery());
		} catch {
			showToast.error("Thao tác thất bại");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!accountToDelete) return;
		setDeleting(true);
		try {
			const result = await userApi.delete(accountToDelete.user_id);
			if (result?.error) {
				showToast.error(result.message || "Xóa tài khoản thất bại");
				return;
			}
			showToast.success("Đã xóa tài khoản");
			setDeleteModal(false);
			setAccountToDelete(null);
			fetchAccounts(buildQuery());
		} catch {
			showToast.error("Xóa tài khoản thất bại");
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div>
			<div className="flex flex-wrap justify-between items-center gap-3 mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Quản lý tài khoản</h1>
					<p className="text-sm text-gray-500">{visibleAccounts.length} tài khoản</p>
				</div>
				<div className="flex items-center gap-3">
					<Link
						href="/dashboard/admin/manage-account/deleted"
						className="inline-flex items-center px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
					>
						<Trash2 className="w-4 h-4 mr-2" />Tài khoản đã xóa
					</Link>
					<button
						onClick={openCreate}
						className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
					>
						<Plus className="w-4 h-4 mr-2" />Tạo tài khoản
					</button>
				</div>
			</div>

			<div className="bg-white shadow rounded-lg p-4 mb-6">
				<div className="flex flex-wrap gap-3">
					<div className="flex-1 min-w-[200px] relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
						<input
							type="text"
							placeholder="Tìm theo tên..."
							value={searchName}
							onChange={(event) => setSearchName(event.target.value)}
							onKeyDown={(event) => event.key === "Enter" && handleSearch()}
							className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
					</div>
					<div className="flex-1 min-w-[200px] relative">
						<Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
						<input
							type="text"
							placeholder="Tìm theo email..."
							value={searchEmail}
							onChange={(event) => setSearchEmail(event.target.value)}
							onKeyDown={(event) => event.key === "Enter" && handleSearch()}
							className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
					</div>
					<select
						value={filterRole}
						onChange={(event) => setFilterRole(event.target.value)}
						className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
					>
						<option value="">Tất cả vai trò</option>
						<option value="manager">Quản lý</option>
						<option value="hr">HR</option>
						<option value="employee">Nhân viên</option>
					</select>
					<select
						value={filterStatus}
						onChange={(event) => setFilterStatus(event.target.value)}
						className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
					>
						<option value="">Tất cả trạng thái</option>
						<option value="active">Đang làm</option>
						<option value="on_leave">Nghỉ phép</option>
						<option value="terminated">Đã nghỉ</option>
					</select>
					<button
						onClick={handleSearch}
						className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
					>
						Tìm kiếm
					</button>
					<button
						onClick={handleReset}
						className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
					>
						Đặt lại
					</button>
				</div>
			</div>

			<div className="bg-white shadow rounded-lg overflow-hidden">
				{loading ? (
					<div className="flex justify-center items-center p-12">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
					</div>
				) : (
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								{[
									"Tài khoản",
									"Liên hệ",
									"Vai trò",
									"Trạng thái",
									"Hành động",
								].map((label) => (
									<th
										key={label}
										className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>
										{label}
									</th>
								))}
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{visibleAccounts.map((account) => {
								const statusMeta = STATUS_META[account.status] || {
									label: account.status,
									color: "bg-gray-100 text-gray-800",
								};
								const isSelf =
									currentUser?.user_id &&
									String(currentUser.user_id) === String(account.user_id);

								return (
									<tr key={account.user_id} className="hover:bg-gray-50">
										<td className="px-5 py-4">
											<div className="flex items-center space-x-3">
												<div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
													<span className="text-sm font-semibold text-indigo-700">
														{account.full_name?.charAt(0)?.toUpperCase()}
													</span>
												</div>
												<div>
													<p className="text-sm font-medium text-gray-900">
														{account.full_name}
													</p>
												</div>
											</div>
										</td>
										<td className="px-5 py-4">
											<p className="text-sm text-gray-700">{account.personal_email}</p>
											<p className="text-xs text-gray-400">
												{account.phone_number || account.company_email || "—"}
											</p>
										</td>
										<td className="px-5 py-4">
											<span
												className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
													ROLE_COLORS[account.role] || "bg-gray-100 text-gray-700"
												}`}
											>
												{ROLE_LABELS[account.role] || account.role}
											</span>
										</td>
										<td className="px-5 py-4">
											<span
												className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusMeta.color}`}
											>
												{statusMeta.label}
											</span>
										</td>
										<td className="px-5 py-4">
											<div className="flex items-center space-x-3">
												<button
													onClick={() => setViewAccount(account)}
													className="text-gray-400 hover:text-indigo-600"
													title="Xem chi tiết"
												>
													<Eye className="w-4 h-4" />
												</button>
												<button
													onClick={() => openEdit(account)}
													className="text-gray-400 hover:text-blue-600"
													title="Chỉnh sửa"
												>
													<Edit2 className="w-4 h-4" />
												</button>
												{!isSelf && (
													<button
														onClick={() => {
															setAccountToDelete(account);
															setDeleteModal(true);
														}}
														className="text-gray-400 hover:text-red-600"
														title="Xóa tài khoản"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												)}
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				)}
				{!loading && visibleAccounts.length === 0 && (
					<div className="text-center py-12">
						<User className="mx-auto h-10 w-10 text-gray-300" />
						<p className="mt-2 text-sm text-gray-500">Không tìm thấy tài khoản nào</p>
					</div>
				)}
			</div>

			<Modal
				isOpen={!!viewAccount}
				onClose={() => setViewAccount(null)}
				title={viewAccount?.full_name || "Chi tiết tài khoản"}
				showEditButton
				onEdit={() => {
					if (viewAccount) {
						openEdit(viewAccount);
						setViewAccount(null);
					}
				}}
			>
				{viewAccount && (
					<div className="p-6 space-y-5">
						<div className="grid grid-cols-2 gap-4">
							{[
								{ icon: <User className="w-4 h-4" />, label: "Họ và tên", val: viewAccount.full_name },
								{ icon: <Mail className="w-4 h-4" />, label: "Email cá nhân", val: viewAccount.personal_email },
								{ icon: <Mail className="w-4 h-4" />, label: "Email công ty", val: viewAccount.company_email || "—" },
								{ icon: <Phone className="w-4 h-4" />, label: "Điện thoại", val: viewAccount.phone_number || "—" },
								{ icon: <MapPin className="w-4 h-4" />, label: "Địa chỉ", val: viewAccount.address || "—" },
								{ icon: <Shield className="w-4 h-4" />, label: "Vai trò", val: ROLE_LABELS[viewAccount.role] || viewAccount.role },
								{ icon: null, label: "Trạng thái", val: STATUS_META[viewAccount.status]?.label || viewAccount.status },
								{ icon: null, label: "Ngày tạo", val: formatDate(viewAccount.created_at) },
								{ icon: null, label: "Cập nhật", val: formatDate(viewAccount.updated_at) },
							].map(({ icon, label, val }) => (
								<div key={label}>
									<p className="text-xs text-gray-500 flex items-center gap-1">{icon}{label}</p>
									<p className="text-sm font-medium text-gray-800 mt-0.5">{val}</p>
								</div>
							))}
						</div>
					</div>
				)}
			</Modal>

			<Modal
				isOpen={modalOpen}
				onClose={() => setModalOpen(false)}
				title={editingAccount ? `Cập nhật: ${editingAccount.full_name}` : "Tạo tài khoản"}
			>
				<div className="p-1 space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-xs font-medium text-gray-600 mb-1">Họ và tên *</label>
							<input
								type="text"
								value={form.full_name}
								onChange={(event) => setForm({ ...form, full_name: event.target.value })}
								className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
							/>
						</div>
						<div>
							<label className="block text-xs font-medium text-gray-600 mb-1">Email cá nhân *</label>
							<input
								type="email"
								value={form.personal_email}
								onChange={(event) => setForm({ ...form, personal_email: event.target.value })}
								className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
							/>
						</div>
						<div>
							<label className="block text-xs font-medium text-gray-600 mb-1">Email công ty</label>
							<input
								type="email"
								value={form.company_email}
								onChange={(event) => setForm({ ...form, company_email: event.target.value })}
								className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
							/>
						</div>
						<div>
							<label className="block text-xs font-medium text-gray-600 mb-1">Số điện thoại</label>
							<input
								type="text"
								value={form.phone_number}
								onChange={(event) => setForm({ ...form, phone_number: event.target.value })}
								className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
							/>
						</div>
						<div>
							<label className="block text-xs font-medium text-gray-600 mb-1">Vai trò *</label>
							<div className="relative">
								<Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
								<select
									value={form.role}
									onChange={(event) =>
										setForm({ ...form, role: event.target.value as AccountForm["role"] })
									}
									className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
								>
									<option value="employee">Nhân viên</option>
									<option value="hr">HR</option>
									<option value="manager">Quản lý</option>
								</select>
							</div>
						</div>
						{!editingAccount && (
							<div>
								<label className="block text-xs font-medium text-gray-600 mb-1">Chức vụ</label>
								<input
									type="text"
									value={form.position}
									onChange={(event) => setForm({ ...form, position: event.target.value })}
									placeholder="Ví dụ: Backend Developer"
									className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
								/>
							</div>
						)}
						<div>
							<label className="block text-xs font-medium text-gray-600 mb-1">Trạng thái *</label>
							<select
								value={form.status}
								onChange={(event) =>
									setForm({ ...form, status: event.target.value as AccountForm["status"] })
								}
								className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
							>
								<option value="active">Đang làm</option>
								<option value="on_leave">Nghỉ phép</option>
								<option value="terminated">Đã nghỉ</option>
							</select>
						</div>
						<div className="col-span-2">
							<label className="block text-xs font-medium text-gray-600 mb-1">
								{editingAccount ? "Mật khẩu mới" : "Mật khẩu"}
								{!editingAccount && " *"}
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
								<input
									type="password"
									value={form.password}
									onChange={(event) => setForm({ ...form, password: event.target.value })}
									placeholder={editingAccount ? "Để trống nếu không đổi" : "Nhập mật khẩu"}
									className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
								/>
							</div>
						</div>
					</div>
					<div>
						<label className="block text-xs font-medium text-gray-600 mb-1">Địa chỉ</label>
						<textarea
							value={form.address}
							onChange={(event) => setForm({ ...form, address: event.target.value })}
							rows={2}
							className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
						/>
					</div>
					<div className="flex justify-end space-x-3 pt-2">
						<button
							onClick={() => setModalOpen(false)}
							className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
						>
							<X className="w-4 h-4 inline mr-1" />Hủy
						</button>
						<button
							onClick={handleSave}
							disabled={saving}
							className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
						>
							{saving ? (
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
							) : (
								<Save className="w-4 h-4 mr-1" />
							)}
							Lưu
						</button>
					</div>
				</div>
			</Modal>

			<Modal
				isOpen={deleteModal}
				onClose={() => {
					setDeleteModal(false);
					setAccountToDelete(null);
				}}
				title="Xác nhận xóa"
			>
				<div className="p-4">
					<p className="text-sm text-gray-700">
						Bạn có chắc muốn xóa tài khoản
						<span className="font-semibold"> {accountToDelete?.full_name}</span>?
					</p>
					<div className="flex justify-end space-x-3 mt-5">
						<button
							onClick={() => {
								setDeleteModal(false);
								setAccountToDelete(null);
							}}
							className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
						>
							Hủy
						</button>
						<button
							onClick={handleDelete}
							disabled={deleting}
							className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
						>
							{deleting ? "Đang xóa..." : "Xóa"}
						</button>
					</div>
				</div>
			</Modal>
		</div>
	);
}

export default withAuth(ManageAccountPage);
