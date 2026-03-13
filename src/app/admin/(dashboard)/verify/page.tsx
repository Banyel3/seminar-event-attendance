"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  CameraOff,
  Upload,
  Search,
  UserCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCcw,
  Users,
  ImagePlus,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  verifyQrToken,
  markAttendance,
  getRegisteredParticipants,
} from "@/app/admin/actions";

type Participant = {
  id: string;
  name: string;
  email: string;
  section: string | null;
  course: string | null;
  status?: string;
  attended?: boolean;
};

type ScanResult = {
  participant: Participant;
  alreadyAttended: boolean;
};

export default function VerifyPage() {
  // ── Hydration guard ─────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ── Camera state ────────────────────────────────────────────────
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const processingRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ── Upload state ────────────────────────────────────────────────
  const [uploadLoading, setUploadLoading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // ── Result state ────────────────────────────────────────────────
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [marking, setMarking] = useState(false);

  // ── Participant list ────────────────────────────────────────────
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectLoading, setSelectLoading] = useState(false);

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

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  // ── Handle decoded QR ─────────────────────────────────────────────────
  const handleQrDecode = useCallback(
    async (raw: string, restartLoop?: () => void) => {
      if (processingRef.current) return;
      processingRef.current = true;

      console.log("[QR Scan] decoded:", raw);

      const result = await verifyQrToken(raw);
      if (!result.success || !result.participant) {
        const isFormatError = result.error === "Invalid QR token format.";
        if (!isFormatError) {
          // Show toast only for real failures (e.g. participant not found)
          toast.error(result.error || "Invalid QR code.");
        }
        // Format errors = stray/partial QR picked by camera, restart quickly
        const delay = isFormatError ? 300 : 1500;
        setTimeout(() => {
          processingRef.current = false;
          restartLoop?.();
        }, delay);
        return;
      }
      setScanResult({
        participant: result.participant as Participant,
        alreadyAttended: result.participant.status === "Attended",
      });
      stopCamera();
    },
    [],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stop camera ─────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Start camera (getUserMedia + rAF + jsQR) ─────────────────────
  const startCamera = async () => {
    const isSecure =
      location.protocol === "https:" ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1";

    if (!isSecure) {
      setCameraError(
        "Camera requires HTTPS. Access via https:// or localhost. " +
          "Use Upload QR or Participant List instead.",
      );
      return;
    }

    setCameraError(null);
    setScanResult(null);
    processingRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
      });

      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setCameraActive(true);

      // Reuse a single off-screen canvas for every frame
      const canvas = document.createElement("canvas");
      canvasRef.current = canvas;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      const jsQR = (await import("jsqr")).default;

      const tick = () => {
        if (!videoRef.current?.srcObject) return; // camera stopped
        if (video.readyState < video.HAVE_ENOUGH_DATA) {
          animFrameRef.current = requestAnimationFrame(tick);
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // No binarization for live camera — screen-displayed QRs appear at
        // varying brightness through the lens; jsQR's own adaptive threshold
        // handles this better. Use attemptBoth to cover normal + inverted QRs.
        const result = jsQR(imageData.data, canvas.width, canvas.height, {
          inversionAttempts: "attemptBoth",
        });

        if (result && !processingRef.current) {
          // Pass tick restart fn so errors resume scanning automatically
          handleQrDecode(result.data, () => {
            animFrameRef.current = requestAnimationFrame(tick);
          });
          return;
        }

        animFrameRef.current = requestAnimationFrame(tick);
      };

      animFrameRef.current = requestAnimationFrame(tick);
    } catch (err: unknown) {
      setCameraActive(false);
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.toLowerCase().includes("permission") ||
        msg.toLowerCase().includes("denied")
      ) {
        setCameraError(
          "Camera permission denied. Please allow camera access in your browser settings.",
        );
      } else if (
        msg.toLowerCase().includes("found") ||
        msg.toLowerCase().includes("device")
      ) {
        setCameraError("No camera found. Make sure your device has a camera.");
      } else {
        setCameraError(`Camera error: ${msg}`);
      }
    }
  };

  // ── Upload QR ───────────────────────────────────────────────────
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadLoading(true);

    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = url;
      });
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Binarise: green (#10B981 → gray≈114) → black; white → white
      const px = imageData.data;
      for (let i = 0; i < px.length; i += 4) {
        const gray = Math.round(
          0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2],
        );
        const val = gray < 140 ? 0 : 255;
        px[i] = val;
        px[i + 1] = val;
        px[i + 2] = val;
      }

      const jsQR = (await import("jsqr")).default;
      const result = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (!result) {
        toast.error("No QR code detected. Make sure the full QR is visible.");
        processingRef.current = false;
        return;
      }
      await handleQrDecode(result.data);
    } catch (err) {
      console.error("Upload QR error:", err);
      toast.error("Failed to read image. Please try a different file.");
      processingRef.current = false;
    } finally {
      setUploadLoading(false);
    }
  };

  // ── Mark from scan ──────────────────────────────────────────────
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
        toast.error(result.error || "Failed.");
      }
    } catch {
      toast.error("Unexpected error.");
    } finally {
      setMarking(false);
    }
  };

  // ── Mark from list ──────────────────────────────────────────────
  const handleSelectParticipant = async (p: Participant) => {
    if (p.attended) {
      toast.info(`${p.name} is already present.`);
      return;
    }
    setSelectedId(p.id);
    setSelectLoading(true);
    try {
      const result = await markAttendance(p.id);
      if (result.success) {
        toast.success(`✅ ${result.name} marked as present!`);
        setParticipants((prev) =>
          prev.map((x) => (x.id === p.id ? { ...x, attended: true } : x)),
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

  const filtered = participants.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.section ?? "").toLowerCase().includes(search.toLowerCase()),
  );
  const notYet = filtered.filter((p) => !p.attended);
  const done = filtered.filter((p) => p.attended);

  // ── SSR skeleton ────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  // ── Scan result view ────────────────────────────────────────────
  if (scanResult) {
    const { participant, alreadyAttended } = scanResult;
    return (
      <div className="p-4 md:p-8 max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-300">
        <Card
          className={`border-2 ${alreadyAttended ? "border-amber-400" : "border-emerald-400"}`}
        >
          <CardHeader className="text-center pb-2">
            <div
              className={`mx-auto p-3 rounded-full w-16 h-16 flex items-center justify-center mb-2 ${alreadyAttended ? "bg-amber-100" : "bg-emerald-100"}`}
            >
              {alreadyAttended ? (
                <XCircle className="w-9 h-9 text-amber-500" />
              ) : (
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              )}
            </div>
            <CardTitle
              className={
                alreadyAttended ? "text-amber-700" : "text-emerald-700"
              }
            >
              {alreadyAttended ? "Already Attended" : "QR Verified ✓"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-xl font-bold text-slate-900">
                {participant.name}
              </p>
              <p className="text-sm text-slate-500">{participant.email}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge className="bg-emerald-100 text-emerald-800">
                  {participant.section}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {participant.course}
                </Badge>
              </div>
            </div>
            {!alreadyAttended && (
              <Button
                onClick={handleMarkFromScan}
                disabled={marking}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {marking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                Mark as Present
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setScanResult(null);
                processingRef.current = false;
              }}
              className="w-full gap-2"
            >
              <RefreshCcw className="h-4 w-4" /> Scan Another
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main view ───────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Verify Attendance
        </h1>
        <p className="text-slate-500">
          Scan, upload, or select a participant to mark as present.
        </p>
      </div>

      {/* Camera + Upload */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Camera Card */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Camera Scanner</CardTitle>
              <CardDescription className="text-xs">
                Hold QR up to the camera.
              </CardDescription>
            </div>
            <Badge
              className={
                cameraActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }
            >
              {cameraActive ? "Live" : "Off"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {cameraError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {cameraError}
              </p>
            )}

            {/* Native <video> element — we own it, no black screen */}
            <div
              className={`relative w-full rounded-xl overflow-hidden bg-black ${cameraActive ? "block" : "hidden"}`}
              style={{ aspectRatio: "4/3" }}
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Viewfinder overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-emerald-400 rounded-lg opacity-80">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br" />
                </div>
              </div>
            </div>

            {!cameraActive && (
              <div
                className="flex flex-col items-center justify-center bg-slate-900 rounded-xl gap-2"
                style={{ aspectRatio: "4/3" }}
              >
                <Camera className="w-8 h-8 text-slate-500" />
                <p className="text-slate-500 text-xs">Camera off</p>
              </div>
            )}

            {!cameraActive ? (
              <Button
                onClick={startCamera}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <Camera className="h-4 w-4" /> Start Camera
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={stopCamera}
                className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <CameraOff className="h-4 w-4" /> Stop Camera
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Upload QR Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Upload QR Image</CardTitle>
            <CardDescription className="text-xs">
              Upload a screenshot or photo of a QR ticket.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => uploadInputRef.current?.click()}
              disabled={uploadLoading}
              className="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl hover:border-emerald-400 hover:bg-emerald-50/50 transition-all cursor-pointer group"
              style={{ aspectRatio: "4/3" }}
            >
              {uploadLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              ) : (
                <>
                  <ImagePlus className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 transition-colors mb-2" />
                  <p className="text-sm text-slate-500 group-hover:text-emerald-600">
                    Click to upload QR image
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    PNG, JPG, screenshot
                  </p>
                </>
              )}
            </button>
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => uploadInputRef.current?.click()}
              disabled={uploadLoading}
            >
              <Upload className="h-4 w-4" />
              {uploadLoading ? "Reading QR..." : "Choose File"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 text-slate-400 text-sm">
        <div className="flex-1 h-px bg-slate-200" />
        OR — Manual Fallback
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Participant List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" /> Participant List
              </CardTitle>
              <CardDescription>
                Tap a name to instantly mark them as present.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadParticipants}
              className="gap-1 text-xs"
            >
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
              <Loader2 className="h-5 w-5 animate-spin" /> Loading...
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-400 py-10">
              No participants found.
            </p>
          ) : (
            <div className="space-y-4">
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
                        <p className="font-semibold text-slate-900 group-hover:text-emerald-700">
                          {p.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {p.section} · {p.email}
                        </p>
                      </div>
                      {selectLoading && selectedId === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600 flex-shrink-0" />
                      ) : (
                        <UserCheck className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
              {done.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Already Present ({done.length})
                  </p>
                  {done.map((p) => (
                    <div
                      key={p.id}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-emerald-100 bg-emerald-50/50 opacity-60"
                    >
                      <div>
                        <p className="font-semibold text-slate-700 line-through">
                          {p.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {p.section} · {p.email}
                        </p>
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
