"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2, RefreshCcw, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { registerParticipant } from "./actions";

type RegistrationData = {
  name: string;
  email: string;
  section: string;
  course: string;
};

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [registered, setRegistered] = useState<RegistrationData | null>(null);

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
        if ((result as { alreadyRegistered?: boolean }).alreadyRegistered) setAlreadyRegistered(true);
      } else if (result.success && result.data) {
        setRegistered({
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

  // ── Nav bar ──────────────────────────────────────────────────────────
  const NavBar = () => (
    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-6 w-full max-w-xs mx-auto">
      <button className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white text-emerald-700 font-semibold text-sm shadow-sm">
        <UserPlus className="w-4 h-4" /> Sign Up
      </button>
    </div>
  );

  // ── Success view ─────────────────────────────────────────────────────
  if (registered) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-500/10 p-4">
        <NavBar />
        <Card className="max-w-md w-full border-emerald-500/20 shadow-lg animate-in fade-in zoom-in-95 duration-500">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-emerald-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl text-emerald-700">You&apos;re Registered!</CardTitle>
            <CardDescription className="text-emerald-600 font-medium">
              Zero Trust Seminar Workshop · Mar 14, 2026
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pt-4">
            <div className="w-full bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
              <p className="font-bold text-xl text-slate-900">{registered.name}</p>
              <p className="text-sm text-slate-500 mt-1">{registered.email}</p>
              <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">{registered.section}</Badge>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">{registered.course}</Badge>
              </div>
            </div>
            <p className="text-sm text-slate-500 text-center">
              Your registration is confirmed. Attendance will be recorded by the event administrators.
            </p>
            <Button
              variant="outline"
              onClick={() => { setRegistered(null); setError(null); }}
              className="w-full text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-2"
            >
              <RefreshCcw className="w-4 h-4" /> Register Another Person
            </Button>
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
            Zero Trust Seminar Workshop
          </CardTitle>
          <CardDescription className="text-base">
            Sign Up · March 14, 2026
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
                  <option>College of Asian &amp; Islamic Studies</option>
                  <option>College of Computing Studies</option>
                  <option>College of Forestry &amp; Environmental Studies</option>
                  <option>College of Criminal Justice Education</option>
                  <option>College of Home Economics</option>
                  <option>College of Engineering</option>
                  <option>College of Medicine</option>
                  <option>College of Public Administration &amp; Development Studies</option>
                  <option>College of Sports Science &amp; Physical Education</option>
                  <option>College of Science and Mathematics</option>
                  <option>College of Social Work &amp; Community Development</option>
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
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Registering...</> : "Register"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t py-4 text-center mt-2 bg-slate-50/50 rounded-b-xl">
          <p className="text-xs text-slate-500">
            Each email can only be registered once.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
