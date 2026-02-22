"use client";

import { useState } from "react";
import { Search, Camera, UserSquare2, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { verifyQrToken, markAttendance } from "@/app/admin/actions";

type ScannedParticipant = {
    id: string;
    name: string;
    email: string;
    section: string;
    course: string;
    status: "Registered" | "Attended" | "QR Generated";
};

export default function VerifyQRPage() {
    const [token, setToken] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [marking, setMarking] = useState(false);
    const [participant, setParticipant] = useState<ScannedParticipant | null>(null);

    const lookupToken = async (value: string) => {
        setLoading(true);
        try {
            const result = await verifyQrToken(value);
            if (result.error) {
                toast.error(result.error);
                setParticipant(null);
            } else if (result.participant) {
                setParticipant({
                    id: result.participant.id,
                    name: result.participant.name,
                    email: result.participant.email,
                    section: result.participant.section,
                    course: result.participant.course,
                    status: result.participant.status as ScannedParticipant["status"],
                });
                toast.success("Participant found!");
            }
        } catch {
            toast.error("Failed to verify token.");
            setParticipant(null);
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token.trim()) return;
        await lookupToken(token);
    };

    const handleMarkAsPresent = async () => {
        if (!participant) return;
        setMarking(true);
        try {
            const result = await markAttendance(participant.id);
            if (result.error) {
                toast.error(result.error);
                if (result.alreadyAttended) {
                    setParticipant({ ...participant, status: "Attended" });
                }
            } else {
                setParticipant({ ...participant, status: "Attended" });
                toast.success(`${result.name} marked as present!`, {
                    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
                });
                setToken("");
                setTimeout(() => setParticipant(null), 3000);
            }
        } catch {
            toast.error("Failed to mark attendance.");
        } finally {
            setMarking(false);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto flex flex-col items-center">
            <div className="w-full flex flex-col gap-2 items-center text-center max-w-2xl mb-4">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Verify Attendance</h1>
                <p className="text-slate-500">Scan QR codes or manually enter tokens to track seminar attendance.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                {/* Input/Scanner Area */}
                <div className="space-y-6">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                            <CardTitle className="text-lg">Manual Entry</CardTitle>
                            <CardDescription>Paste or type the QR string token.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleManualSubmit} className="flex gap-2">
                                <Input
                                    placeholder="e.g. wmsu-bscs-seminar:..."
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    className="focus-visible:ring-emerald-500 font-mono text-sm"
                                />
                                <Button type="submit" disabled={!token || loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-slate-50 px-2 text-slate-500">OR</span>
                        </div>
                    </div>

                    <Card className="shadow-sm border-slate-200 overflow-hidden">
                        <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Camera Scanner</CardTitle>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Ready</Badge>
                            </div>
                            <CardDescription>Hold QR up to the webcam.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="aspect-video bg-slate-900 rounded-xl flex flex-col items-center justify-center text-slate-500 relative overflow-hidden group">
                                <div className="absolute inset-4 border-2 border-dashed border-emerald-500/30 rounded-lg group-hover:border-emerald-500/50 transition-colors"></div>
                                <Camera className="w-10 h-10 mb-2 opacity-50" />
                                <p className="text-sm">Camera viewfinder</p>
                                <p className="text-xs text-slate-600 mt-1">html5-qrcode ready for Phase 1.5</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Participant Result Area */}
                <div className="h-full">
                    {participant ? (
                        <Card className={`h-full shadow-lg border-2 ${participant.status === "Attended" ? "border-emerald-500 bg-emerald-50/20" : "border-emerald-200 animate-in slide-in-from-right-8 fade-in duration-300"}`}>
                            <CardHeader className="text-center pb-2">
                                <div className="mx-auto bg-slate-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                                    {participant.status === "Attended" ? (
                                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                    ) : (
                                        <UserSquare2 className="w-12 h-12 text-slate-600" />
                                    )}
                                </div>
                                <CardTitle className="text-2xl text-slate-900">{participant.name}</CardTitle>
                                <CardDescription className="text-base text-slate-500">{participant.email}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4 flex flex-col gap-4">
                                <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium">Section</span>
                                    <span className="font-bold text-slate-800">{participant.section}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
                                    <span className="text-slate-500 font-medium">Course</span>
                                    <span className="font-bold text-slate-800">{participant.course}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm py-2">
                                    <span className="text-slate-500 font-medium">Status</span>
                                    <Badge
                                        variant="secondary"
                                        className={participant.status === "Attended" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}
                                    >
                                        {participant.status}
                                    </Badge>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-4">
                                {participant.status === "Attended" ? (
                                    <Button disabled className="w-full bg-slate-200 text-slate-500 cursor-not-allowed">
                                        Already Marked Present
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-lg shadow-md transition-transform active:scale-95"
                                        onClick={handleMarkAsPresent}
                                        disabled={marking}
                                    >
                                        {marking ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                                        Mark as Present
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ) : (
                        <Card className="h-full border-dashed border-2 border-slate-200 shadow-sm flex flex-col items-center justify-center bg-slate-50/50 p-8 text-center min-h-[400px]">
                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-slate-300">
                                <UserSquare2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-400">No Participant Selected</h3>
                            <p className="text-sm text-slate-400 mt-2 max-w-xs">
                                Waiting for a valid QR code scan or token entry to display participant details.
                            </p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
