"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileType2, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { importParticipants } from "@/app/admin/actions";

type CSVRecord = {
    name: string;
    email: string;
    section: string;
    course: string;
};

export default function ImportCSVPage() {
    const [records, setRecords] = useState<CSVRecord[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const processCSV = (file: File) => {
        setFileName(file.name);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const parsedData = results.data
                    .map((row: any) => ({
                        name: row.name || row.Name || row["Full Name"] || "",
                        email: row.email || row.Email || row["Email Address"] || "",
                        section: row.section || row.Section || "BSCS 3A",
                        course: row.course || row.Course || "BSCS",
                    }))
                    .filter((r) => r.name && r.email);

                if (parsedData.length > 0) {
                    setRecords(parsedData);
                    toast.success(`Successfully parsed ${parsedData.length} records.`);
                } else {
                    toast.error(
                        "No valid records found. Expected headers: Name, Email, Section, Course."
                    );
                    setRecords([]);
                    setFileName(null);
                }
            },
            error: (error) => {
                toast.error(`Error parsing file: ${error.message}`);
                setFileName(null);
                setRecords([]);
            },
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processCSV(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsHovering(false);
        const file = e.dataTransfer.files?.[0];
        if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
            processCSV(file);
        } else {
            toast.error("Please upload a valid CSV file.");
        }
    };

    const executeImport = async () => {
        setIsImporting(true);
        try {
            const result = await importParticipants(records);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(
                    `Import complete! ${result.inserted} inserted, ${result.skipped} skipped (duplicates), ${result.invalid} invalid.`,
                    { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> }
                );
                setRecords([]);
                setFileName(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        } catch {
            toast.error("Failed to import participants.");
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto h-full">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    Import Participants
                </h1>
                <p className="text-slate-500">
                    Bulk register attendees using a CSV file. Expected headers: Name,
                    Email, Section, Course.
                </p>
            </div>

            {!records.length ? (
                <Card className="shadow-sm border-slate-200 border-dashed border-2">
                    <CardContent className="pt-6">
                        <div
                            className={`min-h-[300px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${isHovering
                                    ? "border-emerald-500 bg-emerald-50/50"
                                    : "border-slate-300 bg-slate-50"
                                }`}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsHovering(true);
                            }}
                            onDragLeave={() => setIsHovering(false)}
                            onDrop={handleDrop}
                        >
                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-emerald-600">
                                <UploadCloud className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">
                                Drag & drop your CSV file here
                            </h3>
                            <p className="text-sm text-slate-500 mt-1 mb-6 text-center max-w-sm">
                                Make sure your file has the correct headers to ensure a smooth
                                mapping process.
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="h-px bg-slate-200 flex-1 w-16"></div>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                                    or
                                </span>
                                <div className="h-px bg-slate-200 flex-1 w-16"></div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept=".csv"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-6 bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 shadow-sm"
                            >
                                Choose CSV File
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="shadow-sm border-emerald-200 flex flex-col overflow-hidden">
                    <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2 text-emerald-900">
                                <FileType2 className="w-5 h-5 text-emerald-600" />
                                {fileName}
                            </CardTitle>
                            <CardDescription className="text-emerald-700/80 mt-1">
                                Found {records.length} valid records ready to import.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 gap-2"
                                onClick={() => {
                                    setRecords([]);
                                    setFileName(null);
                                }}
                            >
                                <Trash2 className="w-4 h-4" /> Cancel
                            </Button>
                            <Button
                                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                onClick={executeImport}
                                disabled={isImporting}
                            >
                                {isImporting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    `Import ${records.length} Records`
                                )}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto max-h-[500px] overflow-y-auto">
                        <Table>
                            <TableHeader className="bg-white sticky top-0 shadow-sm z-10">
                                <TableRow>
                                    <TableHead className="font-semibold text-slate-600 w-12 text-center">
                                        #
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-600">
                                        Name
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-600">
                                        Email
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-600">
                                        Section
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-600">
                                        Course
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.slice(0, 100).map((record, index) => (
                                    <TableRow key={index} className="hover:bg-emerald-50/30">
                                        <TableCell className="text-center text-slate-400 font-mono text-xs">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-900">
                                            {record.name}
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {record.email}
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {record.section}
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {record.course}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {records.length > 100 && (
                            <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 border-t">
                                Showing first 100 of {records.length} records.
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
