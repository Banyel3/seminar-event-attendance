"use client";

import { useState, useEffect } from "react";
import { Plus, Search, FileEdit, Trash2, Loader2, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getParticipants,
  addParticipant,
  updateParticipant,
  deleteParticipant,
  type ParticipantRow,
} from "@/app/admin/actions";

export default function ParticipantsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);

  // Form fields for Add dialog
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addSection, setAddSection] = useState("");
  const [addCourse, setAddCourse] = useState("");

  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<ParticipantRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSection, setEditSection] = useState("");
  const [editCourse, setEditCourse] = useState("");

  const openEdit = (p: ParticipantRow) => {
    setEditTarget(p);
    setEditName(p.name);
    setEditEmail(p.email);
    setEditSection(p.section ?? "");
    setEditCourse(p.course ?? "");
    setIsEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setEditLoading(true);
    try {
      const result = await updateParticipant(editTarget.id, {
        name: editName,
        email: editEmail.toLowerCase().trim(),
        section: editSection || undefined,
        course: editCourse || undefined,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Participant updated.");
        setIsEditOpen(false);
        loadParticipants();
      }
    } catch {
      toast.error("Failed to update participant.");
    } finally {
      setEditLoading(false);
    }
  };

  const loadParticipants = async () => {
    setLoading(true);
    try {
      const data = await getParticipants(
        searchTerm || undefined,
        filterStatus || undefined,
      );
      setParticipants(data);
    } catch (err) {
      console.error("Failed to load participants:", err);
      toast.error("Failed to load participants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParticipants();
  }, [filterStatus]);

  // Helper: extract year level digit from section string e.g. "BSCS 3A" → "3"
  const getYear = (section?: string | null) =>
    section ? (section.match(/\d+/)?.[0] ?? "") : "";

  // Client-side derived filter lists
  const uniqueCourses = Array.from(
    new Set(participants.map((p) => p.course).filter(Boolean))
  ).sort() as string[];

  const uniqueYears = Array.from(
    new Set(participants.map((p) => getYear(p.section)).filter(Boolean))
  ).sort((a, b) => Number(a) - Number(b));

  // Apply client-side course + year filters on top of server-filtered list
  const displayed = participants.filter((p) => {
    if (filterCourse && p.course !== filterCourse) return false;
    if (filterYear && getYear(p.section) !== filterYear) return false;
    return true;
  });

  // ── Excel export ────────────────────────────────────────────────────
  const exportToExcel = () => {
    const toRow = (p: ParticipantRow) => ({
      Name: p.name,
      Email: p.email,
      Section: p.section ?? "",
      Course: p.course ?? "",
      Status: p.status,
      "Time In": p.timestamp ?? "",
    });

    // Base pool: whatever the current course/year/search filters show
    const attended  = displayed.filter((p) => p.status === "Attended");
    const evaluated = displayed.filter((p) => p.status === "Evaluated");
    const total     = displayed.filter((p) => p.status === "Attended" || p.status === "Evaluated");

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(attended.map(toRow)),  "Attended");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(evaluated.map(toRow)), "Evaluated");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(total.map(toRow)),     "Total Attendance");

    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `attendance-${timestamp}.xlsx`);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadParticipants();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleAdd = async () => {
    setAddLoading(true);
    try {
      const result = await addParticipant({
        name: addName,
        email: addEmail,
        section: addSection,
        course: addCourse,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Participant added successfully!");
        setIsAddOpen(false);
        setAddName("");
        setAddEmail("");
        setAddSection("");
        setAddCourse("");
        loadParticipants();
      }
    } catch {
      toast.error("Failed to add participant.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      const result = await deleteParticipant(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${name} has been removed.`);
        loadParticipants();
      }
    } catch {
      toast.error("Failed to delete participant.");
    }
  };

  const StatusBadge = ({
    status,
    time,
  }: {
    status: ParticipantRow["status"];
    time?: string;
  }) => {
    switch (status) {
      case "Evaluated":
        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge
              variant="secondary"
              className="bg-purple-100 text-purple-800 hover:bg-purple-200"
            >
              {status}
            </Badge>
            {time && <span className="text-[10px] text-slate-500">{time}</span>}
          </div>
        );
      case "Attended":
        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
            >
              {status}
            </Badge>
            {time && <span className="text-[10px] text-slate-500">{time}</span>}
          </div>
        );
      case "QR Generated":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 hover:bg-blue-200"
          >
            {status}
          </Badge>
        );
      case "Registered":
      default:
        return (
          <Badge
            variant="secondary"
            className="bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto flex flex-col h-full min-h-[calc(100vh-80px)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Participants
          </h1>
          <p className="text-slate-500">
            Manage all registered students for the event.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={exportToExcel}
            className="gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
          >
            <Download className="w-4 h-4" /> Export
          </Button>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-transform active:scale-95 text-sm gap-2">
              <Plus className="w-4 h-4" /> Add Participant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Participant</DialogTitle>
              <DialogDescription>
                Manually register a participant. They will be able to generate a
                QR ticket right after.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="add-name">Full Name</Label>
                <Input
                  id="add-name"
                  placeholder="John Doe"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-email">Email</Label>
                <Input
                  id="add-email"
                  type="email"
                  placeholder="john@wmsu.edu.ph"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="add-section">Section</Label>
                  <Input
                    id="add-section"
                    value={addSection}
                    onChange={(e) => setAddSection(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="add-course">College / Course</Label>
                  <select
                    id="add-course"
                    value={addCourse}
                    onChange={(e) => setAddCourse(e.target.value)}
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="" disabled>
                      Select college
                    </option>
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
                    <option>
                      College of Public Administration & Development Studies
                    </option>
                    <option>
                      College of Sports Science & Physical Education
                    </option>
                    <option>College of Science and Mathematics</option>
                    <option>
                      College of Social Work & Community Development
                    </option>
                    <option>College of Teacher Education</option>
                    <option>Professional Science Master&apos;s Program</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleAdd}
                disabled={addLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {addLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save Participant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div> {/* end flex gap-2 wrapper */}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/50 rounded-t-xl">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9 bg-white border-slate-200 focus-visible:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <select
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Registered">Registered Only</option>
              <option value="QR Generated">QR Generated</option>
              <option value="Attended">Attended</option>
              <option value="Evaluated">Evaluated</option>
            </select>
            <select
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
            >
              <option value="">All Courses</option>
              {uniqueCourses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="">All Year Levels</option>
              {uniqueYears.map((y) => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results summary */}
        <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center gap-2 text-sm">
          <span className="font-semibold text-slate-800">{displayed.length}</span>
          <span className="text-slate-500">
            {displayed.length === 1 ? "result" : "results"} found
            {filterCourse || filterYear || filterStatus || searchTerm ? " for " : ""}
            {filterCourse && <span className="font-medium text-slate-700">{filterCourse}</span>}
            {filterCourse && filterYear && <span className="text-slate-400"> · </span>}
            {filterYear && <span className="font-medium text-slate-700">Year {filterYear}</span>}
            {(filterCourse || filterYear) && filterStatus && <span className="text-slate-400"> · </span>}
            {filterStatus && <span className="font-medium text-slate-700">{filterStatus}</span>}
            {(filterCourse || filterYear || filterStatus) && searchTerm && <span className="text-slate-400"> · </span>}
            {searchTerm && <span className="font-medium text-slate-700">&ldquo;{searchTerm}&rdquo;</span>}
          </span>
          {(filterCourse || filterYear || filterStatus || searchTerm) && (
            <span className="text-xs text-slate-400 ml-auto">{participants.length} total</span>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : participants.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p className="text-sm">No participants found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-600">
                    Name
                  </TableHead>
                  <TableHead className="hidden md:table-cell font-semibold text-slate-600">
                    Email
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600">
                    Section
                  </TableHead>
                  <TableHead className="hidden sm:table-cell font-semibold text-slate-600">
                    Course
                  </TableHead>
                  <TableHead className="font-semibold text-slate-600">
                    Status
                  </TableHead>
                  <TableHead className="text-right font-semibold text-slate-600">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((participant) => (
                  <TableRow key={participant.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-900 border-b border-slate-100">
                      {participant.name}
                      <div className="text-xs text-slate-500 md:hidden mt-0.5">
                        {participant.email}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-slate-600 border-b border-slate-100">
                      {participant.email}
                    </TableCell>
                    <TableCell className="text-slate-600 border-b border-slate-100">
                      {participant.section ?? (
                        <Badge
                          variant="secondary"
                          className="bg-orange-100 text-orange-700 hover:bg-orange-200"
                        >
                          Guest
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-slate-600 border-b border-slate-100">
                      {participant.course ?? (
                        <Badge
                          variant="secondary"
                          className="bg-orange-100 text-orange-700 hover:bg-orange-200"
                        >
                          Guest
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="border-b border-slate-100">
                      <StatusBadge
                        status={participant.status}
                        time={participant.timestamp}
                      />
                    </TableCell>
                    <TableCell className="text-right border-b border-slate-100">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => openEdit(participant)}
                        >
                          <FileEdit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() =>
                            handleDelete(participant.id, participant.name)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 text-xs text-slate-400 rounded-b-xl">
          <span>{participants.length} total participants registered</span>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Participant</DialogTitle>
            <DialogDescription>
              Update the participant&apos;s details. Email changes take effect immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="text"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-section">Section</Label>
                <Input
                  id="edit-section"
                  value={editSection}
                  onChange={(e) => setEditSection(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-course">College / Course</Label>
                <select
                  id="edit-course"
                  value={editCourse}
                  onChange={(e) => setEditCourse(e.target.value)}
                  className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">— None / Guest —</option>
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
          </div>
          <DialogFooter>
            <Button
              onClick={handleEdit}
              disabled={editLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {editLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
