"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import confetti from "canvas-confetti";
import * as htmlToImage from "html-to-image";
import { Loader2, AlertCircle, CheckCircle2, Download, RefreshCcw, Clock, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { registerParticipant } from "./actions";

type TicketData = {
  name: string;
  email: string;
  section: string;
  course: string;
  token: string;
};

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);

  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ticketData) {
      const duration = 2500;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#10B981", "#34D399", "#ffffff"] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#10B981", "#34D399", "#ffffff"] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [ticketData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAlreadyRegistered(false);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await registerParticipant(formData);
      if (result.error) {
        setError(result.error);
        if ((result as any).alreadyRegistered) setAlreadyRegistered(true);
      } else if (result.success && result.data) {
        setTicketData(result.data);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveQRCode = () => {
    if (!qrRef.current) return;
    htmlToImage.toPng(qrRef.current, { backgroundColor: "#ffffff" })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `QR-Ticket-${ticketData?.name.replace(/\s+/g, "-")}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("QR Code saved!");
      })
      .catch(() => toast.error("Failed to save QR code."));
  };

  // ── Nav bar ──────────────────────────────────────────────────────────
  const NavBar = () => (
    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-6 w-full max-w-xs mx-auto">
      <button className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white text-emerald-700 font-semibold text-sm shadow-sm">
        <UserPlus className="w-4 h-4" /> Sign Up
      </button>
      <Link href="/attend" className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-slate-500 hover:text-emerald-600 font-semibold text-sm transition-colors">
        <Clock className="w-4 h-4" /> Time In
      </Link>
    </div>
  );

  // ── QR success view ──────────────────────────────────────────────────
  if (ticketData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-500/10 p-4">
        <NavBar />
        <Card className="max-w-md w-full border-emerald-500/20 shadow-lg animate-in fade-in zoom-in-95 duration-500">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-emerald-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl text-emerald-700">Registration Complete!</CardTitle>
            <CardDescription className="text-emerald-600 font-medium">
              College of Computing Studies – WMSU
            </CardDescription>
          </CardHeader>
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
                  Valid for BSCS 3A Seminar Workshop · Mar 7, 2026
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-500 text-center">
              Save this QR and present it to the organizer on <strong>March 7</strong> to mark your attendance.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button onClick={saveQRCode} className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <Download className="w-4 h-4" /> Save QR
              </Button>
              <Button variant="outline" onClick={() => { setTicketData(null); setError(null); }} className="w-full sm:flex-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-2">
                <RefreshCcw className="w-4 h-4" /> Start Over
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Registration form ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <NavBar />
      <Card className="max-w-md md:max-w-lg w-full shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="text-center space-y-2">
          <p className="text-sm font-semibold tracking-wider text-emerald-600 uppercase">
            College of Computing Studies – WMSU
          </p>
          <CardTitle className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
            Seminar Workshop Sign Up
          </CardTitle>
          <CardDescription className="text-base">
            BSCS 3A · March 7, 2026
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className={`mb-6 ${alreadyRegistered ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-red-50 border-red-200 text-red-800"}`}>
              <AlertCircle className="h-4 w-4" color={alreadyRegistered ? "#D97706" : "#EF4444"} />
              <AlertTitle>{alreadyRegistered ? "Already Registered" : "Error"}</AlertTitle>
              <AlertDescription>
                {error}
                {alreadyRegistered && (
                  <Link href="/attend" className="ml-2 underline font-semibold text-amber-700 hover:text-amber-900">
                    Go to Time In →
                  </Link>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" placeholder="Juan Dela Cruz" required className="focus-visible:ring-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" placeholder="juan@wmsu.edu.ph" required className="focus-visible:ring-emerald-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input id="section" name="section" defaultValue="BSCS 3A" required className="focus-visible:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course">College / Course</Label>
                <select
                  id="course"
                  name="course"
                  required
                  defaultValue=""
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" disabled>Select your college</option>
                  <option>College of Law</option>
                  <option>College of Agriculture</option>
                  <option>College of Liberal Arts</option>
                  <option>College of Architecture</option>
                  <option>College of Nursing</option>
                  <option>College of Asian & Islamic Studies</option>
                  <option>College of Computing Studies</option>
                  <option>College of Forestry & Environmental Studies</option>
                  <option>College of Criminal Justice Education</option>
                  <option>College of Home Economics</option>
                  <option>College of Engineering</option>
                  <option>College of Medicine</option>
                  <option>College of Public Administration & Development Studies</option>
                  <option>College of Sports Science & Physical Education</option>
                  <option>College of Science and Mathematics</option>
                  <option>College of Social Work & Community Development</option>
                  <option>College of Teacher Education</option>
                  <option>Professional Science Master&apos;s Program</option>
                </select>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 text-white transition-all hover:scale-[1.02] active:scale-95"
              disabled={loading}
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Registering...</> : "Register & Get QR Ticket"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t py-4 text-center mt-2 bg-slate-50/50 rounded-b-xl">
          <p className="text-xs text-slate-500">
            Each email can only be registered once. Already registered?{" "}
            <Link href="/attend" className="text-emerald-600 hover:underline font-medium">Time In here</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
