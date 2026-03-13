"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Video,
  CalendarDays,
  Users,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Link2,
  PlusCircle,
  Pencil,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  createGoogleMeetEvent,
  updateGoogleMeetEvent,
  syncAllToMeet,
  getMeetStatus,
} from "@/app/admin/actions";

type EventDetails = {
  eventId: string;
  title: string;
  description: string;
  start: string;
  end: string;
  meetLink: string | null;
  htmlLink: string | null;
  attendeeCount: number;
};

type Status = {
  connected: boolean;
  event: EventDetails | null;
  error?: string;
};

function formatDateTime(iso: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Converts an ISO datetime string to "YYYY-MM-DD" for a date input. */
function isoToDateInput(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-CA"); // "YYYY-MM-DD"
  } catch {
    return "";
  }
}

/** Converts an ISO datetime string to "HH:MM" for a time input. */
function isoToTimeInput(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function GoogleMeetAdminPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
  });

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
  });

  const fetchStatus = useCallback(async () => {
    const result = await getMeetStatus();
    setStatus(result as Status);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.startTime || !form.endTime) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Build ISO 8601 datetime strings with +08:00 offset (Manila)
    const startDateTime = `${form.date}T${form.startTime}:00+08:00`;
    const endDateTime = `${form.date}T${form.endTime}:00+08:00`;

    if (new Date(endDateTime) <= new Date(startDateTime)) {
      toast.error("End time must be after start time.");
      return;
    }

    setCreating(true);
    try {
      const result = await createGoogleMeetEvent({
        title: form.title,
        description: form.description,
        startDateTime,
        endDateTime,
        timeZone: "Asia/Manila",
      });

      if ("error" in result && result.error) {
        toast.error(`Failed to create event: ${result.error}`);
      } else {
        toast.success("Google Meet event created!");
        await fetchStatus();
      }
    } finally {
      setCreating(false);
    }
  };

  const openEdit = () => {
    if (!status?.event) return;
    setEditForm({
      title: status.event.title,
      description: status.event.description,
      date: isoToDateInput(status.event.start),
      startTime: isoToTimeInput(status.event.start),
      endTime: isoToTimeInput(status.event.end),
    });
    setEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title || !editForm.date || !editForm.startTime || !editForm.endTime) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const startDateTime = `${editForm.date}T${editForm.startTime}:00+08:00`;
    const endDateTime = `${editForm.date}T${editForm.endTime}:00+08:00`;
    if (new Date(endDateTime) <= new Date(startDateTime)) {
      toast.error("End time must be after start time.");
      return;
    }
    setSaving(true);
    try {
      const result = await updateGoogleMeetEvent({
        title: editForm.title,
        description: editForm.description,
        startDateTime,
        endDateTime,
        timeZone: "Asia/Manila",
      });
      if ("error" in result && result.error) {
        toast.error(`Failed to update event: ${result.error}`);
      } else {
        toast.success("Event updated! Guests were notified.");
        setEditing(false);
        await fetchStatus();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncAllToMeet();
      if ("error" in result && result.error) {
        toast.error(`Sync failed: ${result.error}`);
      } else if ("success" in result && result.success) {
        toast.success(
          result.added === 0
            ? `All participants are already synced (${result.skipped} skipped).`
            : `Synced ${result.added} participant${result.added !== 1 ? "s" : ""}. ${result.skipped} already present.`,
        );
        await fetchStatus();
      }
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  // Not connected
  if (!status?.connected) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Video className="w-5 h-5 text-blue-600" />
          Google Meet
        </h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">
                Google account not connected
              </p>
              <p className="text-sm text-amber-700 mt-1">
                You need to authorize with Google before creating a Meet event.
              </p>
            </div>
          </div>
        </div>
        <Link
          href="/admin/google-auth"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded-xl transition-colors w-fit"
        >
          <ExternalLink className="w-4 h-4" />
          Connect Google Account
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Video className="w-5 h-5 text-blue-600" />
          Google Meet
        </h1>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Google connected
        </div>
      </div>

      {/* Error loading event */}
      {status.error && !status.event && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <strong>Error loading event details:</strong> {status.error}
        </div>
      )}

      {/* No event yet — show creation form */}
      {!status.event ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-blue-600" />
              Create a Google Meet Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. BSCS Seminar Workshop 2026"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Optional event description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm({ ...form, startTime: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm({ ...form, endTime: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400">
                All times are in Philippine Standard Time (UTC+8).
              </p>
              <Button
                type="submit"
                disabled={creating}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 mr-2" />
                    Create Meet Event
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* Event exists — show details + sync */
        <div className="space-y-4">
          {/* Event Details Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  Event Details
                </CardTitle>
                {!editing && (
                  <Button variant="outline" size="sm" onClick={openEdit} className="gap-1.5">
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editing ? (
                /* ── Edit form ── */
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-title">Event Title *</Label>
                    <Input
                      id="edit-title"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-description">Description</Label>
                    <Input
                      id="edit-description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-date">Date *</Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-start">Start Time *</Label>
                      <Input
                        id="edit-start"
                        type="time"
                        value={editForm.startTime}
                        onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-end">End Time *</Label>
                      <Input
                        id="edit-end"
                        type="time"
                        value={editForm.endTime}
                        onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">All times are in Philippine Standard Time (UTC+8). Existing guests will be notified of any changes.</p>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 flex-1">
                      {saving ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                      ) : (
                        <><Pencil className="w-4 h-4 mr-2" />Save Changes</>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditing(false)}
                      disabled={saving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              ) : (
                /* ── Read-only view ── */
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Title</p>
                    <p className="text-slate-800 font-semibold">{status.event.title}</p>
                  </div>
                  {status.event.description && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Description</p>
                      <p className="text-slate-700 text-sm">{status.event.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Start</p>
                      <p className="text-slate-700 text-sm">{formatDateTime(status.event.start)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">End</p>
                      <p className="text-slate-700 text-sm">{formatDateTime(status.event.end)}</p>
                    </div>
                  </div>
                  {status.event.meetLink && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Meet Link</p>
                      <a
                        href={status.event.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-blue-600 hover:underline text-sm font-medium"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        {status.event.meetLink}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {status.event.htmlLink && (
                    <a
                      href={status.event.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-xs mt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open in Google Calendar
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sync Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Guest List Sync
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  Attendees in this event
                </span>
                <span className="font-bold text-slate-800 text-lg">
                  {status.event.attendeeCount}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Clicking <strong>Sync All Participants</strong> will add every
                registered participant (those not already invited) to this
                event&apos;s guest list. Each newly-added participant will
                receive a Google Calendar invite email.
              </p>
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                New participants who register <em>after</em> this sync are
                automatically added to the guest list in real time.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleSync}
                  disabled={syncing}
                  className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Syncing…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync All Participants
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchStatus}
                  disabled={loading || syncing}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
