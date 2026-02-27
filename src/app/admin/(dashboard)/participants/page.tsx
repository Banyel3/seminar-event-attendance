"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, FileEdit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    deleteParticipant,
    type ParticipantRow,
} from "@/app/admin/actions";

export default function ParticipantsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [participants, setParticipants] = useState<ParticipantRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [addLoading, setAddLoading] = useState(false);

    // Form fields for Add dialog
    const [addName, setAddName] = useState("");
    const [addEmail, setAddEmail] = useState("");
    const [addSection, setAddSection] = useState("BSCS 3A");
    const [addCourse, setAddCourse] = useState("BSCS");

    const loadParticipants = async () => {
        setLoading(true);
        try {
            const data = await getParticipants(searchTerm || undefined, filterStatus || undefined);
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
                setAddSection("BSCS 3A");
                setAddCourse("BSCS");
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

    const StatusBadge = ({ status, time }: { status: ParticipantRow["status"]; time?: string }) => {
        switch (status) {
            case "Attended":
                return (
                    <div className="flex flex-col gap-1 items-start">
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                            {status}
                        </Badge>
                        {time && <span className="text-[10px] text-slate-500">{time}</span>}
                    </div>
                );
            case "QR Generated":
                return (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        {status}
                    </Badge>
                );
            case "Registered":
            default:
                return (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                        {status}
                    </Badge>
                );
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto flex flex-col h-full min-h-[calc(100vh-80px)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Participants</h1>
                    <p className="text-slate-500">Manage all registered students for the event.</p>
                </div>

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
                                Manually register a participant. They will be able to generate a QR ticket right after.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="add-name">Full Name</Label>
                                <Input id="add-name" placeholder="John Doe" value={addName} onChange={(e) => setAddName(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="add-email">Email</Label>
                                <Input id="add-email" type="email" placeholder="john@wmsu.edu.ph" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="add-section">Section</Label>
                                    <Input id="add-section" value={addSection} onChange={(e) => setAddSection(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="add-course">College / Course</Label>
                                    <select
                                        id="add-course"
                                        value={addCourse}
                                        onChange={(e) => setAddCourse(e.target.value)}
                                        className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="" disabled>Select college</option>
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
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAdd} disabled={addLoading} className="bg-emerald-600 hover:bg-emerald-700">
                                {addLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save Participant
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
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
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="Registered">Registered Only</option>
                            <option value="QR Generated">QR Generated</option>
                            <option value="Attended">Attended</option>
                        </select>
                    </div>
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
                                    <TableHead className="font-semibold text-slate-600">Name</TableHead>
                                    <TableHead className="hidden md:table-cell font-semibold text-slate-600">Email</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Section</TableHead>
                                    <TableHead className="hidden sm:table-cell font-semibold text-slate-600">Course</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Status</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-600">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {participants.map((participant) => (
                                    <TableRow key={participant.id} className="hover:bg-slate-50">
                                        <TableCell className="font-medium text-slate-900 border-b border-slate-100">
                                            {participant.name}
                                            <div className="text-xs text-slate-500 md:hidden mt-0.5">{participant.email}</div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-slate-600 border-b border-slate-100">
                                            {participant.email}
                                        </TableCell>
                                        <TableCell className="text-slate-600 border-b border-slate-100">
                                            {participant.section}
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell text-slate-600 border-b border-slate-100">
                                            {participant.course}
                                        </TableCell>
                                        <TableCell className="border-b border-slate-100">
                                            <StatusBadge status={participant.status} time={participant.timestamp} />
                                        </TableCell>
                                        <TableCell className="text-right border-b border-slate-100">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(participant.id, participant.name)}
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
                <div className="p-4 border-t border-slate-100 text-xs text-slate-500 rounded-b-xl">
                    <span>Showing {participants.length} participants</span>
                </div>
            </div>
        </div >
    );
}
