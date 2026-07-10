"use client";

import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

type GoogleUser = {
    email?: string;
    name?: string;
    picture?: string;
    sub?: string;
};

export default function LoginButton() {
    const [user, setUser] = useState<GoogleUser | null>(null);

    useEffect(() => {
        const storedUser = window.localStorage.getItem("career-portal-user");

        if (storedUser) {
            setUser(JSON.parse(storedUser) as GoogleUser);
        }
    }, []);

    const handleLogout = () => {
        window.localStorage.removeItem("career-portal-user");
        window.dispatchEvent(new Event("career-portal-auth-changed"));
        setUser(null);
    };

    if (user) {
        return (
            <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-[#111111]">
                {user.picture ? (
                    <img
                        src={user.picture}
                        alt={user.name ?? "Người dùng"}
                        className="h-8 w-8 rounded-full object-cover"
                    />
                ) : null}
                <span className="max-w-[140px] truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                    {user.name ?? user.email ?? "Đã đăng nhập"}
                </span>
                <button
                    type="button"
                    onClick={handleLogout}
                    className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                    Đăng xuất
                </button>
            </div>
        );
    }

    return (
        <GoogleLogin
            onSuccess={async (credentialResponse) => {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/auth/google`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        credential: credentialResponse.credential,
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    window.localStorage.setItem("career-portal-user", JSON.stringify(data));
                    window.dispatchEvent(new Event("career-portal-auth-changed"));
                    setUser(data);
                }
            }}
            onError={() => console.log("Login Failed")}
            theme="outline"
            shape="pill"
            text="signin_with"
            size="large"
        />
    );
}