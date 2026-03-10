"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
<<<<<<< HEAD
=======
import Image from "next/image";
import QRCode from "react-qr-code";
import * as htmlToImage from "html-to-image";
>>>>>>> 8c3c184b028badd86a2be2e5e166464d9e32864e
import {
    Loader2, AlertCircle, CheckCircle2,
    Clock, UserPlus, CalendarClock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getTicket } from "@/app/actions";

// ── Event config ──────────────────────────────────────────────────────
const EVENT_OPEN = new Date("2026-03-14T07:00:00+08:00");

type RegistrationData = {
    name: string;
    email: string;
    section: string;
    course: string;
};

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

function getTimeLeft(): TimeLeft {
    const diff = EVENT_OPEN.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
    };
}

const NavBar = () => (
    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-6 w-full max-w-xs mx-auto">
        <Link href="/" className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-slate-500 hover:text-emerald-600 font-semibold text-sm transition-colors">
            <UserPlus className="w-4 h-4" /> Sign Up
        </Link>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white text-emerald-700 font-semibold text-sm shadow-sm">
            <Clock className="w-4 h-4" /> Check Status
        </button>
    </div>
);

const Tile = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center bg-white rounded-2xl px-5 py-4 shadow-md min-w-[72px]">
        <span className="text-4xl font-extrabold text-emerald-600 tabular-nums">{String(value).padStart(2, "0")}</span>
        <span className="text-xs text-slate-500 uppercase tracking-widest mt-1">{label}</span>
    </div>
);

export default function AttendPage() {
    const [isOpen, setIsOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft());
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notRegistered, setNotRegistered] = useState(false);
    const [regData, setRegData] = useState<RegistrationData | null>(null);

    useEffect(() => {
        const tick = () => {
            setTimeLeft(getTimeLeft());
            setIsOpen(Date.now() >= EVENT_OPEN.getTime());
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setNotRegistered(false);
        try {
            const result = await getTicket(email);
            if (result.error) {
                setError(result.error);
                if ((result as { notRegistered?: boolean }).notRegistered) setNotRegistered(true);
            } else if (result.success && result.data) {
                setRegData({
                    name: result.data.name,
                    email: result.data.email,
                    section: result.data.section,
                    course: result.data.course,
                });
            }
        } catch {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Coming Soon ──────────────────────────────────────────────────────
    if (!isOpen) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-50 to-emerald-100 p-4">
                <NavBar />
                <div className="text-center max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="mx-auto bg-emerald-100 p-4 rounded-3xl w-20 h-20 flex items-center justify-center mb-6 shadow-sm">
                        <CalendarClock className="w-10 h-10 text-emerald-600" />
                    </div>
<<<<<<< HEAD
=======

                    <div className="flex justify-center mb-3">
                        <Image src="/ztfk-logo.png" alt="Zero Trust Fund Kids" width={80} height={80} className="rounded-full" />
                    </div>
>>>>>>> 8c3c184b028badd86a2be2e5e166464d9e32864e
                    <p className="text-sm font-semibold tracking-wider text-emerald-600 uppercase mb-2">
                        Zero Trust Fund Kids
                    </p>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2 leading-tight">
<<<<<<< HEAD
                        Zero Trust Seminar Workshop
=======
                        Seminar Workshop
>>>>>>> 8c3c184b028badd86a2be2e5e166464d9e32864e
                    </h1>
                    <p className="text-lg text-slate-500 mb-8">
                        Event opens on <strong className="text-emerald-700">March 14, 2026 at 7:00 AM</strong>
                    </p>
                    <div className="flex items-center justify-center gap-3 mb-10 flex-wrap">
                        <Tile value={timeLeft.days} label="Days" />
                        <span className="text-3xl font-bold text-slate-400 pb-4">:</span>
                        <Tile value={timeLeft.hours} label="Hours" />
                        <span className="text-3xl font-bold text-slate-400 pb-4">:</span>
                        <Tile value={timeLeft.minutes} label="Mins" />
                        <span className="text-3xl font-bold text-slate-400 pb-4">:</span>
                        <Tile value={timeLeft.seconds} label="Secs" />
                    </div>
                    <p className="text-slate-500 text-sm">
                        Not registered yet?{" "}
                        <Link href="/" className="text-emerald-600 font-semibold hover:underline">Sign up now →</Link>
                    </p>
                </div>
            </div>
        );
    }

    // ── Registration found ───────────────────────────────────────────────
    if (regData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-500/10 p-4">
                <NavBar />
                <Card className="max-w-md w-full border-emerald-500/20 shadow-lg animate-in fade-in zoom-in-95 duration-500">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto bg-emerald-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                        </div>
                        <CardTitle className="text-2xl text-emerald-700">Registration Confirmed</CardTitle>
                        <CardDescription className="text-emerald-600 font-medium">
                            Zero Trust Seminar Workshop · Mar 14, 2026
                        </CardDescription>
                    </CardHeader>
<<<<<<< HEAD
                    <CardContent className="flex flex-col items-center gap-4 pt-4">
                        <div className="w-full bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                            <p className="font-bold text-xl text-slate-900">{regData.name}</p>
                            <p className="text-sm text-slate-500 mt-1">{regData.email}</p>
                            <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">{regData.section}</Badge>
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">{regData.course}</Badge>
=======
                    <CardContent className="flex flex-col items-center gap-6 pt-4">
                        <div ref={qrRef} className="p-4 bg-white rounded-2xl border-4 border-emerald-500 shadow-md flex flex-col items-center">
                            <QRCode value={ticketData.token} size={260} level="H" fgColor="#10B981" className="w-full max-w-[260px] h-auto" />
                            <div className="mt-4 text-center w-full">
                                <p className="font-bold text-xl text-slate-900">{ticketData.name}</p>
                                <p className="text-sm text-slate-500 mb-2">{ticketData.email}</p>
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">{ticketData.section}</Badge>
                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">{ticketData.course}</Badge>
                                </div>
                                <p className="text-xs text-emerald-700 font-semibold mt-2 border-t pt-2 border-slate-100">
                                    Zero Trust Fund Kids Seminar Workshop · Mar 14, 2026
                                </p>
>>>>>>> 8c3c184b028badd86a2be2e5e166464d9e32864e
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 text-center">
                            Your registration is confirmed. Attendance will be recorded by the event administrators.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => { setRegData(null); setEmail(""); setError(null); }}
                            className="w-full text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        >
                            Check Another Email
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ── Email lookup form ────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
            <NavBar />
            <Card className="max-w-md w-full shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="text-center space-y-2">
                    <div className="flex justify-center mb-1">
                        <Image src="/ztfk-logo.png" alt="Zero Trust Fund Kids" width={64} height={64} className="rounded-full" />
                    </div>
                    <p className="text-sm font-semibold tracking-wider text-emerald-600 uppercase">
                        Zero Trust Fund Kids
                    </p>
                    <CardTitle className="text-2xl md:text-3xl font-extrabold text-slate-900">
                        Check Registration
                    </CardTitle>
                    <CardDescription className="text-base">
                        Enter your registered email to confirm your registration.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className={`mb-6 ${notRegistered ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                            <AlertCircle className="h-4 w-4" color={notRegistered ? "#D97706" : "#EF4444"} />
                            <AlertTitle>{notRegistered ? "Not Registered" : "Error"}</AlertTitle>
                            <AlertDescription>
                                {error}
                                {notRegistered && (
                                    <Link href="/" className="ml-2 underline font-semibold text-amber-700 hover:text-amber-900">
                                        Sign up now →
                                    </Link>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Registered Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="juan@wmsu.edu.ph"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="focus-visible:ring-emerald-500"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 text-white transition-all hover:scale-[1.02] active:scale-95"
                            disabled={loading}
                        >
                            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Checking...</> : "Check Registration"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center border-t py-4 text-center mt-2 bg-slate-50/50 rounded-b-xl">
                    <p className="text-xs text-slate-500">
                        Not registered yet?{" "}
                        <Link href="/" className="text-emerald-600 hover:underline font-medium">Sign up here</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
