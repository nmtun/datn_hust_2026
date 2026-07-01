import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export default function ForgotPassword() {
  return (
    <div className="flex min-h-screen items-center justify-center from-slate-100 via-blue-50 to-slate-200 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
          <LockKeyhole className="h-10 w-10 text-blue-600" />
        </div>

        <h1 className="mb-4 text-center text-2xl font-bold text-slate-800">
          Quên mật khẩu
        </h1>

        <p className="text-center leading-7 text-slate-600">
          Chức năng này hiện chưa được phát triển.
          <br />
          Vui lòng liên hệ{" "}
          <span className="font-semibold text-blue-600">Tenant Admin</span> để
          được cấp lại mật khẩu mới.
        </p>

        <Link
          href="/auth/login"
          className="mt-8 block w-full rounded-lg bg-blue-600 py-3 text-center font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
        >
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}