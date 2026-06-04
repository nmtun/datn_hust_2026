"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
	ArrowLeft,
	Search,
	Mail,
	User,
	Shield,
	Undo2,
	Eye,
	Phone,
	MapPin,
	UserX,
} from "lucide-react";
import { userApi, AdminProfile } from "@/app/api/userApi";
import { showToast } from "@/app/utils/toast";
import Modal from "@/app/components/Modal";
import { withAuth } from "@/app/middleware/withAuth";

const ROLE_LABELS: Record<string, string> = {
	tenant_admin: "Admin",
	manager: "Quản lý",
	hr: "HR",
	employee: "Nhân viên",
	candidate: "Ứng viên",
};

const ROLE_COLORS: Record<string, string> = {
	tenant_admin: "bg-purple-100 text-purple-800",
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

function DeletedAccountsPage() {
	const router = useRouter();
	const [accounts, setAccounts] = useState<AdminProfile[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchName, setSearchName] = useState("");
	const [searchEmail, setSearchEmail] = useState("");
	const [filterRole, setFilterRole] = useState("");
	const [filterStatus, setFilterStatus] = useState("");

	const [viewAccount, setViewAccount] = useState<AdminProfile | null>(null);
	const [restoreModal, setRestoreModal] = useState(false);
	const [accountToRestore, setAccountToRestore] = useState<AdminProfile | null>(null);
	const [restoring, setRestoring] = useState(false);

	useEffect(() => {
		fetchDeletedAccounts();
	}, []);

	const buildQuery = () => ({
		full_name: searchName.trim() || undefined,
		email: searchEmail.trim() || undefined,
		role: filterRole || undefined,
		status: filterStatus || undefined,
		include_deleted: true,
	});

	const fetchDeletedAccounts = async (params?: {
		full_name?: string;
		email?: string;
		role?: string;
		status?: string;
		include_deleted?: boolean;
	}) => {
		setLoading(true);
		try {
			const result = await userApi.getAll(params || buildQuery());
			if (result?.error) {
				showToast.error(result.message || "Không thể tải danh sách tài khoản đã xóa");
				setAccounts([]);
				return;
			}

			const deletedAccounts = (result.users || [])
				.filter((account: AdminProfile) => account.is_deleted)
				.filter((account: AdminProfile) => account.role !== "candidate");
			setAccounts(deletedAccounts);
		} catch {
			showToast.error("Không thể tải danh sách tài khoản đã xóa");
			setAccounts([]);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = () => {
		fetchDeletedAccounts(buildQuery());
	};

	const handleReset = () => {
		setSearchName("");
		setSearchEmail("");
		setFilterRole("");
		setFilterStatus("");
		fetchDeletedAccounts({ include_deleted: true });
	};

	const handleRestore = async () => {
		if (!accountToRestore) return;
		setRestoring(true);
		try {
			const result = await userApi.restore(accountToRestore.user_id);
			if (result?.error) {
				showToast.error(result.message || "Khôi phục tài khoản thất bại");
				return;
			}
			showToast.success("Khôi phục tài khoản thành công");
			setRestoreModal(false);
			setAccountToRestore(null);
			fetchDeletedAccounts(buildQuery());
		} catch {
			showToast.error("Khôi phục tài khoản thất bại");
		} finally {
			setRestoring(false);
		}
	};

	return (
		<div>
			<div className="flex flex-wrap items-center gap-3 mb-6">
				<button
					onClick={() => router.push("/dashboard/admin/manage-account")}
					className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
				>
					<ArrowLeft className="w-5 h-5" />
				</button>
				<h1 className="text-2xl font-bold text-gray-900">Tài khoản đã xóa</h1>
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
						<option value="tenant_admin">Admin</option>
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
							{accounts.map((account) => {
								const statusMeta = STATUS_META[account.status] || {
									label: account.status,
									color: "bg-gray-100 text-gray-800",
								};

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
													<p className="text-xs text-gray-400">#{account.user_id}</p>
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
													onClick={() => {
														setAccountToRestore(account);
														setRestoreModal(true);
													}}
													className="text-gray-400 hover:text-green-600"
													title="Khôi phục"
												>
													<Undo2 className="w-4 h-4" />
												</button>
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				)}
				{!loading && accounts.length === 0 && (
					<div className="text-center py-12">
						<UserX className="mx-auto h-10 w-10 text-gray-300" />
						<p className="mt-2 text-sm text-gray-500">Không có tài khoản đã xóa</p>
					</div>
				)}
			</div>

			<Modal
				isOpen={!!viewAccount}
				onClose={() => setViewAccount(null)}
				title={viewAccount?.full_name || "Chi tiết tài khoản"}
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
				isOpen={restoreModal}
				onClose={() => {
					setRestoreModal(false);
					setAccountToRestore(null);
				}}
				title="Xác nhận khôi phục"
			>
				<div className="p-4">
					<p className="text-sm text-gray-700">
						Bạn có chắc muốn khôi phục tài khoản
						<span className="font-semibold"> {accountToRestore?.full_name}</span>?
					</p>
					<div className="flex justify-end space-x-3 mt-5">
						<button
							onClick={() => {
								setRestoreModal(false);
								setAccountToRestore(null);
							}}
							className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
						>
							Hủy
						</button>
						<button
							onClick={handleRestore}
							disabled={restoring}
							className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
						>
							{restoring ? "Đang khôi phục..." : "Khôi phục"}
						</button>
					</div>
				</div>
			</Modal>
		</div>
	);
}

export default withAuth(DeletedAccountsPage);
