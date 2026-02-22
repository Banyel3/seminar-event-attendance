"use client";

import { useState, useEffect } from "react";
import { Users, QrCode, CheckCircle2, Percent, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getOverviewStats, getRecentScans } from "@/app/admin/actions";

type Stats = {
    totalRegistered: number;
    qrGenerated: number;
    attended: number;
    attendanceRate: number;
};

type RecentScan = {
    id: string;
    name: string;
    email: string;
    section: string;
    time: string;
    status: "Present";
};

export default function OverviewPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [statsData, scansData] = await Promise.all([
                    getOverviewStats(),
                    getRecentScans(5),
                ]);
                setStats(statsData);
                setRecentScans(scansData);
            } catch (err) {
                console.error("Failed to load overview:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
                <p className="text-slate-500">Live statistics for BSCS 3A Seminar Workshop.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Registered</CardTitle>
                        <div className="p-2 bg-slate-100 rounded-full">
                            <Users className="w-4 h-4 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{stats?.totalRegistered ?? 0}</div>
                        <p className="text-xs text-slate-500 mt-1">Expected participants</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">QR Generated</CardTitle>
                        <div className="p-2 bg-slate-100 rounded-full">
                            <QrCode className="w-4 h-4 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{stats?.qrGenerated ?? 0}</div>
                        <p className="text-xs text-emerald-600 mt-1 font-medium">Tickets issued</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Attended</CardTitle>
                        <div className="p-2 bg-slate-100 rounded-full">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{stats?.attended ?? 0}</div>
                        <p className="text-xs text-slate-500 mt-1">Checked in at door</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Attendance Rate</CardTitle>
                        <div className="p-2 bg-slate-100 rounded-full">
                            <Percent className="w-4 h-4 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-emerald-600">{stats?.attendanceRate ?? 0}%</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <span
                                className="absolute left-0 top-0 bottom-0 bg-emerald-500 transition-all duration-500"
                                style={{ width: `${stats?.attendanceRate ?? 0}%` }}
                            ></span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <Card className="shadow-sm border-slate-200 overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-emerald-600" />
                            <CardTitle className="text-lg">Recent Scans</CardTitle>
                        </div>
                        <CardDescription>The latest participants who successfully checked in.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {recentScans.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <p className="text-sm">No attendance scans recorded yet.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50 text-slate-500">
                                    <TableRow>
                                        <TableHead className="w-[200px] font-semibold text-slate-600">Name</TableHead>
                                        <TableHead className="font-semibold text-slate-600">Section</TableHead>
                                        <TableHead className="font-semibold text-slate-600">Time</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-600">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentScans.map((scan) => (
                                        <TableRow key={scan.id} className="hover:bg-emerald-50/50">
                                            <TableCell className="font-medium text-slate-900">
                                                <div>{scan.name}</div>
                                                <div className="text-xs text-slate-500 md:hidden">{scan.email}</div>
                                            </TableCell>
                                            <TableCell className="text-slate-600">
                                                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                                                    {scan.section}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-600 text-sm whitespace-nowrap">{scan.time}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                                    {scan.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
