"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShieldCheck, LogOut, LayoutDashboard, Users, FileUp, ScanLine } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { adminLogout } from "@/app/admin/actions";

export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    const tabs = [
        { name: "Overview", href: "/admin", icon: LayoutDashboard },
        { name: "Participants", href: "/admin/participants", icon: Users },
        { name: "Import CSV", href: "/admin/import", icon: FileUp },
        { name: "Verify QR", href: "/admin/verify", icon: ScanLine },
    ];

    const handleLogout = async () => {
        await adminLogout();
        toast.success("Logged out");
        router.push("/admin/login");
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800">
                <div className="p-6 border-b border-slate-800 bg-slate-950/50">
                    <div className="flex items-center gap-3 mb-1">
                        <Image src="/ztfk-logo.png" alt="Zero Trust Fund Kids" width={32} height={32} className="rounded-full" />
                        <span className="text-emerald-500 font-bold text-lg">Admin Panel</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Zero Trust Fund Kids Seminar Workshop</p>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-emerald-500/10 hover:text-emerald-400"
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.name}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/50 mb-4">
                        <Avatar className="w-8 h-8 border border-slate-700">
                            <AvatarFallback className="bg-emerald-900 text-emerald-400 text-xs">AD</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-200">Admin User</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors w-full"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
                {/* Mobile Top Navbar */}
                <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b sticky top-0 z-10">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold">
                        <ShieldCheck className="w-5 h-5" />
                        Admin
                    </div>
                    <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">AD</AvatarFallback>
                    </Avatar>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 z-10 pb-safe">
                {tabs.map((tab) => (
                    <Link
                        key={tab.name}
                        href={tab.href}
                        className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-emerald-600 min-w-[64px]"
                    >
                        <tab.icon className="w-5 h-5" />
                        <span className="text-[10px] font-medium">{tab.name}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}
