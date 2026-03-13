"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCcw,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { registerParticipant } from "./actions";

type RegistrationData = {
  name: string;
  email: string;
  section: string | null;
  course: string | null;
};

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [registered, setRegistered] = useState<RegistrationData | null>(null);
  const [isGuest, setIsGuest] = useState(false);

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
        if ((result as { alreadyRegistered?: boolean }).alreadyRegistered)
          setAlreadyRegistered(true);
      } else if (result.success && result.data) {
        setRegistered({
          name: result.data.name,
          email: result.data.email,
          section: result.data.section ?? null,
          course: result.data.course ?? null,
        });
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success view ─────────────────────────────────────────────────────
  if (registered) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full border border-white/30 shadow-2xl animate-in fade-in zoom-in-95 duration-500 bg-white/20 backdrop-blur-md">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4">
              <Image
                src="/ztfk-logo.png"
                alt="Zero Trust Fund Kids"
                width={72}
                height={72}
                className="rounded-full mx-auto"
              />
            </div>
            <CardTitle className="text-2xl text-white drop-shadow">
              You&apos;re Registered!
            </CardTitle>
            <CardDescription className="text-emerald-300 font-medium">
              Zero Trust Seminar Workshop · Mar 14, 2026
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pt-4">
            <div className="w-full bg-white/20 rounded-xl p-4 text-center border border-white/20">
              <p className="font-bold text-xl text-white">{registered.name}</p>
              <p className="text-sm text-white/70 mt-1">{registered.email}</p>
              <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                {registered.section && registered.course ? (
                  <>
                    <Badge
                      variant="secondary"
                      className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30"
                    >
                      {registered.section}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30"
                    >
                      {registered.course}
                    </Badge>
                  </>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-orange-500/30 text-orange-200 border border-orange-400/30"
                  >
                    Guest
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-sm text-white/70 text-center">
              Your registration is confirmed. Attendance will be recorded by the
              event administrators.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setRegistered(null);
                setError(null);
              }}
              className="w-full border-white/30 text-white hover:bg-white/20 bg-transparent gap-2"
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Glassmorphic card — bg video visible through it */}
      <Card className="max-w-md md:max-w-lg w-full shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white/15 backdrop-blur-md border border-white/25">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <Image
              src="/ztfk-logo.png"
              alt="Zero Trust Fund Kids"
              width={64}
              height={64}
              className="rounded-full"
            />
          </div>
          <p className="text-sm font-semibold tracking-wider text-emerald-300 uppercase">
            Zero Trust Fund Kids
          </p>
          <CardTitle className="text-2xl md:text-3xl font-extrabold text-white leading-tight drop-shadow">
            Zero Trust Seminar Workshop
          </CardTitle>
          <CardDescription className="text-base text-white/70">
            Sign Up · March 14, 2026
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert
              variant="destructive"
              className={`mb-6 ${alreadyRegistered ? "bg-amber-500/20 border-amber-400/40 text-amber-200" : "bg-red-500/20 border-red-400/40 text-red-200"}`}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {alreadyRegistered ? "Already Registered" : "Error"}
              </AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white font-semibold">
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Juan Dela Cruz"
                required
                className="bg-white/35 border-white/40 text-slate-900 placeholder:text-slate-500 focus-visible:ring-emerald-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-semibold">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="juan@wmsu.edu.ph"
                required
                className="bg-white/35 border-white/40 text-slate-900 placeholder:text-slate-500 focus-visible:ring-emerald-400"
              />
            </div>

            {/* Guest checkbox */}
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <input
                type="checkbox"
                name="isGuest"
                checked={isGuest}
                onChange={(e) => setIsGuest(e.target.checked)}
                className="w-4 h-4 rounded border-white/40 bg-white/35 accent-emerald-400 cursor-pointer"
              />
              <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                Guest / External attendee
              </span>
            </label>

            <div
              className={`grid grid-cols-2 gap-4 transition-opacity duration-200 ${isGuest ? "opacity-40 pointer-events-none" : "opacity-100"}`}
            >
              <div className="space-y-2">
                <Label htmlFor="section" className="text-white font-semibold">
                  Section
                </Label>
                <Input
                  id="section"
                  name="section"
                  placeholder="e.g. BSCS 3A"
                  defaultValue=""
                  disabled={isGuest}
                  required={!isGuest}
                  className="bg-white/35 border-white/40 text-slate-900 placeholder:text-slate-500 focus-visible:ring-emerald-400 disabled:cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course" className="text-white font-semibold">
                  College / Course
                </Label>
                <select
                  id="course"
                  name="course"
                  defaultValue=""
                  disabled={isGuest}
                  required={!isGuest}
                  className="w-full h-9 rounded-md border border-white/40 bg-white/35 px-3 py-1 text-sm text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:cursor-not-allowed"
                >
                  <option value="" disabled className="text-slate-800">
                    Select your college
                  </option>
                  <option className="text-slate-800">College of Law</option>
                  <option className="text-slate-800">
                    College of Agriculture
                  </option>
                  <option className="text-slate-800">
                    College of Liberal Arts
                  </option>
                  <option className="text-slate-800">
                    College of Architecture
                  </option>
                  <option className="text-slate-800">College of Nursing</option>
                  <option className="text-slate-800">
                    College of Asian &amp; Islamic Studies
                  </option>
                  <option className="text-slate-800">
                    College of Computing Studies
                  </option>
                  <option className="text-slate-800">
                    College of Forestry &amp; Environmental Studies
                  </option>
                  <option className="text-slate-800">
                    College of Criminal Justice Education
                  </option>
                  <option className="text-slate-800">
                    College of Home Economics
                  </option>
                  <option className="text-slate-800">
                    College of Engineering
                  </option>
                  <option className="text-slate-800">
                    College of Medicine
                  </option>
                  <option className="text-slate-800">
                    College of Public Administration &amp; Development Studies
                  </option>
                  <option className="text-slate-800">
                    College of Sports Science &amp; Physical Education
                  </option>
                  <option className="text-slate-800">
                    College of Science and Mathematics
                  </option>
                  <option className="text-slate-800">
                    College of Social Work &amp; Community Development
                  </option>
                  <option className="text-slate-800">
                    College of Teacher Education
                  </option>
                  <option className="text-slate-800">
                    Professional Science Master&apos;s Program
                  </option>
                </select>
              </div>
            </div>
            {!isGuest && (
              <p className="text-xs text-white/40 -mt-1">
                Follow the format shown in the placeholders, e.g. section as{" "}
                <span className="font-medium text-white/60">BSCS 3A</span>.
              </p>
            )}
            <Button
              type="submit"
              className="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-900/40"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </Button>
            <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-white/10 border border-white/15 text-white/70">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-emerald-300" />
              <p className="text-xs leading-relaxed">
                <strong className="text-white">Already registered?</strong> Each
                email can only be registered once. Contact the organizer if you
                need assistance.
              </p>
            </div>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-white/15 py-4 text-center mt-2">
          <p className="text-xs text-white/50">
            Registered with different details? Please contact the organizer for
            assistance.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
