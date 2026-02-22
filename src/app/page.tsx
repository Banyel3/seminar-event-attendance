"use client";

import { useState, useRef, useEffect } from "react";
import QRCode from "react-qr-code";
import confetti from "canvas-confetti";
import * as htmlToImage from "html-to-image";
import { Loader2, AlertCircle, CheckCircle2, Download, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateTicket } from "./actions";

type TicketData = {
  name: string;
  email: string;
  section: string;
  course: string;
  token: string;
};

export default function AttendPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);

  const qrRef = useRef<HTMLDivElement>(null);

  // Trigger confetti when ticket successfully generated
  useEffect(() => {
    if (ticketData) {
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#10B981', '#34D399', '#ffffff']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#10B981', '#34D399', '#ffffff']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [ticketData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await generateTicket(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.success && result.data) {
        setTicketData(result.data);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveQRCode = () => {
    if (qrRef.current) {
      htmlToImage.toPng(qrRef.current, { backgroundColor: '#ffffff' })
        .then(function (dataUrl) {
          const link = document.createElement('a');
          link.download = `QR-Ticket-${ticketData?.name.replace(/\s+/g, '-')}.png`;
          link.href = dataUrl;
          link.click();
          toast.success("QR Code saved to photos!");
        })
        .catch(function (error) {
          console.error('oops, something went wrong!', error);
          toast.error("Failed to save QR code.");
        });
    }
  };

  const resetForm = () => {
    setTicketData(null);
    setError(null);
  };

  if (ticketData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-500/10 p-4">
        <Card className="max-w-md w-full border-emerald-500/20 shadow-lg animate-in fade-in zoom-in-95 duration-500">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-emerald-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl text-emerald-700">Ticket Generated!</CardTitle>
            <CardDescription className="text-emerald-600 font-medium">
              College of Computing Studies – WMSU
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 pt-4">

            {/* Downloadable QR Area */}
            <div ref={qrRef} className="p-4 bg-white rounded-2xl border-4 border-emerald-500 shadow-md flex flex-col items-center">
              <QRCode
                value={ticketData.token}
                size={280}
                level="H"
                fgColor="#10B981"
                className="w-full max-w-[280px] h-auto md:max-w-[320px]"
              />
              <div className="mt-4 text-center w-full">
                <p className="font-bold text-xl text-slate-900">{ticketData.name}</p>
                <p className="text-sm text-slate-500 mb-2">{ticketData.email}</p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">{ticketData.section}</Badge>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">{ticketData.course}</Badge>
                </div>
                <p className="text-xs text-emerald-700 font-semibold mt-2 border-t pt-2 border-slate-100">
                  Valid for BSCS 3A Seminar Workshop
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-500 text-center">
              Show this QR to the organizer at the entrance.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button onClick={saveQRCode} className="w-full sm:flex-1 transition-transform hover:scale-105 active:scale-95 text-white gap-2">
                <Download className="w-4 h-4" /> Save QR
              </Button>
              <Button variant="outline" onClick={resetForm} className="w-full sm:flex-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-2">
                <RefreshCcw className="w-4 h-4" /> Start Over
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="max-w-md md:max-w-lg w-full shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="text-center space-y-2">
          <p className="text-sm font-semibold tracking-wider text-emerald-600 uppercase">
            College of Computing Studies – WMSU
          </p>
          <CardTitle className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
            Mark Your Attendance & Get QR Ticket
          </CardTitle>
          <CardDescription className="text-base">
            BSCS 3A Seminar Workshop
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-800">
              <AlertCircle className="h-4 w-4" color="#EF4444" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Juan Dela Cruz"
                required
                className="focus-visible:ring-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="juan@wmsu.edu.ph"
                required
                className="focus-visible:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  name="section"
                  defaultValue="BSCS 3A"
                  required
                  className="focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Input
                  id="course"
                  name="course"
                  defaultValue="BSCS"
                  required
                  className="focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 text-white transition-all hover:scale-[1.02] active:scale-95 select-none"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate My QR Ticket"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t py-4 text-center mt-2 bg-slate-50/50 rounded-b-xl">
          <p className="text-xs text-slate-500">
            Only pre-registered participants can generate a ticket
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
