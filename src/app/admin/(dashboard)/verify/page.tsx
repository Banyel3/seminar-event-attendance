"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
    Camera, CameraOff, Search, UserCheck, CheckCircle2,
    XCircle, Loader2, RefreshCcw, Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    verifyQrToken,
    markAttendance,
    getRegisteredParticipants,
} from "@/app/admin/actions";

type Participant = {
    id: string;
    name: string;
    email: string;
    section: string;
    course: string;
    status?: string;
    attended?: boolean;
    attendedAt?: string | null;
};

type ScanResult = {
    participant: Participant;
    alreadyAttended: boolean;
};

const SCANNER_ID = "qr-scanner-container";

export default function VerifyPage() {
    // ── Camera state ────────────────────────────────────────────────
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const processingRef = useRef(false);

    // ── Scan / mark state ───────────────────────────────────────────
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [marking, setMarking] = useState(false);

    // ── Participant list (fallback) ─────────────────────────────────
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectLoading, setSelectLoading] = useState(false);

    // ── Load participant list ───────────────────────────────────────
    const loadParticipants = useCallback(async () => {
        setListLoading(true);
        try {
            const data = await getRegisteredParticipants();
            setParticipants(data);
        } catch {
            toast.error("Failed to load participants.");
        } finally {
            setListLoading(false);
        }
    }, []);

    useEffect(() => { loadParticipants(); }, [loadParticipants]);

    // ── Handle a decoded QR string ──────────────────────────────────
    const handleQrDecode = useCallback(async (decodedText: string) => {
        if (processingRef.current) return;
        processingRef.current = true;

        try {
            const result = await verifyQrToken(decodedText);
            if (!result.success || !result.participant) {
                toast.error(result.error || "Invalid QR code.");
                setTimeout(() => { processingRef.current = false; }, 2000);
                return;
            }
            setScanResult({
                participant: result.participant as Participant,
                alreadyAttended: result.participant.status === "Attended",
            });
            await stopCamera();
        } catch {
            toast.error("Failed to verify QR code.");
            setTimeout(() => { processingRef.current = false; }, 2000);
        }
    }, []);

    // ── Camera start / stop ─────────────────────────────────────────
    const startCamera = async () => {
        setCameraError(null);
        setScanResult(null);
        setCameraActive(true);
    };

    const stopCamera = async () => {
        setCameraActive(false);
        if (scannerRef.current?.isScanning) {
            try { await scannerRef.current.stop(); } catch { /* ignore */ }
        }
    };

    // Mount/unmount scanner when cameraActive changes
    useEffect(() => {
        if (!cameraActive) return;

        const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
        scannerRef.current = scanner;
        processingRef.current = false;

        scanner
            .start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                handleQrDecode,
                () => { /* ignore errors per frame */ }
            )
            .catch((err: unknown) => {
                const msg = err instanceof Error ? err.message : String(err);
                setCameraError(
                    msg.includes("permission")
                        ? "Camera permission denied. Please allow camera access."
                        : "Could not start camera. Make sure your device has a camera."
                );
                setCameraActive(false);
            });

        return () => {
            if (scanner.isScanning) {
                scanner.stop().catch(() => { /* ignore */ });
            }
        };
    }, [cameraActive, handleQrDecode]);

    // ── Mark attendance from camera scan ────────────────────────────
    const handleMarkFromScan = async () => {
        if (!scanResult) return;
        setMarking(true);
        try {
            const result = await markAttendance(scanResult.participant.id);
            if (result.success) {
                toast.success(`✅ ${result.name} marked as present!`);
                setScanResult(null);
                processingRef.current = false;
                loadParticipants();
            } else {
                toast.error(result.error || "Failed to mark attendance.");
            }
        } catch {
            toast.error("Unexpected error.");
        } finally {
            setMarking(false);
        }
    };

    // ── Mark attendance from list selection ─────────────────────────
    const handleSelectParticipant = async (p: Participant) => {
        if (p.attended) {
            toast.info(`${p.name} is already marked as present.`);
            return;
        }
        setSelectedId(p.id);
        setSelectLoading(true);
        try {
            const result = await markAttendance(p.id);
            if (result.success) {
                toast.success(`✅ ${result.name} marked as present!`);
                setParticipants((prev) =>
                    prev.map((x) => x.id === p.id ? { ...x, attended: true } : x)
                );
            } else {
                toast.error(result.error || "Failed.");
            }
        } catch {
            toast.error("Unexpected error.");
        } finally {
            setSelectLoading(false);
            setSelectedId(null);
        }
    };

    // ── Filtered list ───────────────────────────────────────────────
    const filtered = participants.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.section.toLowerCase().includes(search.toLowerCase())
    );
    const notYet = filtered.filter((p) => !p.attended);
    const done = filtered.filter((p) => p.attended);

    // ── Scan result overlay ─────────────────────────────────────────
    if (scanResult) {
        const { participant, alreadyAttended } = scanResult;
        return (
            <div className="p-4 md:p-8 max-w-lg mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <Card className={`border-2 ${alreadyAttended ? "border-amber-400" : "border-emerald-400"}`}>
                    <CardHeader className="text-center pb-2">
                        <div className={`mx-auto p-3 rounded-full w-16 h-16 flex items-center justify-center mb-2 ${alreadyAttended ? "bg-amber-100" : "bg-emerald-100"}`}>
                            {alreadyAttended
                                ? <XCircle className="w-9 h-9 text-amber-500" />
                                : <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                            }
                        </div>
                        <CardTitle className={alreadyAttended ? "text-amber-700" : "text-emerald-700"}>
                            {alreadyAttended ? "Already Attended" : "QR Verified!"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-slate-50 rounded-xl p-4 space-y-1">
                            <p className="text-xl font-bold text-slate-900">{participant.name}</p>
                            <p className="text-sm text-slate-500">{participant.email}</p>
                            <div className="flex gap-2 mt-2">
                                <Badge className="bg-emerald-100 text-emerald-800">{participant.section}</Badge>
                                <Badge variant="outline">{participant.course}</Badge>
                            </div>
                        </div>

                        {alreadyAttended ? (
                            <p className="text-sm text-amber-700 text-center">This participant's attendance is already recorded.</p>
                        ) : (
                            <Button
                                onClick={handleMarkFromScan}
                                disabled={marking}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                            >
                                {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                                Mark as Present
                            </Button>
                        )}

                        <Button variant="outline" onClick={() => { setScanResult(null); processingRef.current = false; }} className="w-full gap-2">
                            <RefreshCcw className="h-4 w-4" /> Scan Another
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-3xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Verify Attendance</h1>
                <p className="text-slate-500">Scan QR codes or select a participant to mark as present.</p>
            </div>

            {/* ── Camera Scanner Card ─────────────────────────────────── */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                        <CardTitle className="text-lg">Camera Scanner</CardTitle>
                        <CardDescription>Hold participant's QR code up to the camera.</CardDescription>
                    </div>
                    <Badge className={cameraActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                        {cameraActive ? "Live" : "Off"}
                    </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                    {cameraError && (
                        <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm border border-red-200">
                            {cameraError}
                        </div>
                    )}

                    {/* Scanner mount point — always in DOM when active */}
                    <div
                        id={SCANNER_ID}
                        className={`w-full rounded-xl overflow-hidden bg-black ${cameraActive ? "min-h-[280px]" : "hidden"}`}
                    />

                    {!cameraActive && (
                        <div className="flex flex-col items-center justify-center min-h-[180px] bg-slate-900 rounded-xl gap-3">
                            <Camera className="w-10 h-10 text-slate-500" />
                            <p className="text-slate-500 text-sm">Camera is off</p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        {!cameraActive ? (
                            <Button onClick={startCamera} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                                <Camera className="h-4 w-4" /> Start Camera
                            </Button>
                        ) : (
                            <Button variant="outline" onClick={stopCamera} className="flex-1 gap-2 text-red-600 border-red-200 hover:bg-red-50">
                                <CameraOff className="h-4 w-4" /> Stop Camera
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ── Divider ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 text-slate-400 text-sm">
                <div className="flex-1 h-px bg-slate-200" />
                OR — Manual Fallback
                <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* ── Participant List ─────────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="w-5 h-5 text-emerald-600" /> Participant List
                            </CardTitle>
                            <CardDescription>Select a name to mark them as present.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={loadParticipants} className="gap-1 text-xs">
                            <RefreshCcw className="h-3 w-3" /> Refresh
                        </Button>
                    </div>
                    <div className="relative mt-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by name or section..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 focus-visible:ring-emerald-500"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {listLoading ? (
                        <div className="flex items-center justify-center py-10 gap-2 text-slate-500">
                            <Loader2 className="h-5 w-5 animate-spin" /> Loading participants...
                        </div>
                    ) : filtered.length === 0 ? (
                        <p className="text-center text-slate-400 py-10">No participants found.</p>
                    ) : (
                        <div className="space-y-4">
                            {/* Not yet attended */}
                            {notYet.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Not Yet Present ({notYet.length})
                                    </p>
                                    {notYet.map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => handleSelectParticipant(p)}
                                            disabled={selectLoading && selectedId === p.id}
                                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left group active:scale-[0.99]"
                                        >
                                            <div>
                                                <p className="font-semibold text-slate-900 group-hover:text-emerald-700">{p.name}</p>
                                                <p className="text-xs text-slate-400">{p.section} · {p.email}</p>
                                            </div>
                                            {selectLoading && selectedId === p.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                                            ) : (
                                                <UserCheck className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Already attended */}
                            {done.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Already Present ({done.length})
                                    </p>
                                    {done.map((p) => (
                                        <div
                                            key={p.id}
                                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-emerald-100 bg-emerald-50/50 text-left opacity-70"
                                        >
                                            <div>
                                                <p className="font-semibold text-slate-700 line-through">{p.name}</p>
                                                <p className="text-xs text-slate-400">{p.section} · {p.email}</p>
                                            </div>
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
