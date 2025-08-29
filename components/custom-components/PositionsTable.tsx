"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, Loader2, Upload, Building2 } from "lucide-react"

interface PositionsTableProps {
    positions: any[] | undefined
    loading: boolean
    uploading: string | null
    onUploadJdFile: (positionId: string) => void
    onChangeJdFile: (file: File | null) => void
}

export function PositionsTable({ positions, loading, uploading, onUploadJdFile, onChangeJdFile }: PositionsTableProps) {
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="border-slate-200 hover:bg-slate-50">
                        <TableHead className="font-semibold text-slate-700">Position ID</TableHead>
                        <TableHead className="font-semibold text-slate-700">Title</TableHead>
                        <TableHead className="font-semibold text-slate-700">Organization</TableHead>
                        <TableHead className="font-semibold text-slate-700">Created At</TableHead>
                        <TableHead className="font-semibold text-slate-700">JD Data</TableHead>
                        <TableHead className="font-semibold text-slate-700">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-12">
                                <div className="flex items-center justify-center gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    <span className="text-slate-600">Loading positions...</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : Array.isArray(positions) && positions.length > 0 ? (
                        positions.map((position: any, idx: number) => (
                            <TableRow key={position._id?.toString() || idx} className="border-slate-100 hover:bg-slate-50/50">
                                <TableCell className="font-mono text-sm text-slate-600">
                                    {position._id ? position._id.slice(-8) : "-"}
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium text-slate-900">{position.name || "-"}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="border-slate-200 text-slate-700">
                                        {position.organization_id || "-"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-slate-600">
                                    {position.createdAt ? new Date(position.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        timeZone: 'UTC',
                                    }) : "-"}
                                </TableCell>
                                <TableCell>
                                    {position.jd_object ? (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button size="sm" variant="outline" className="border-slate-200 hover:bg-slate-50">
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View JD
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[800px] max-h-[600px] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle className="text-xl font-semibold text-slate-900">
                                                        Job Description Data
                                                    </DialogTitle>
                                                    <DialogDescription className="text-slate-600">
                                                        JSON data for {position.name}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="py-4">
                                                    <pre className="bg-slate-50 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap break-words">
                                                        {JSON.stringify(position.jd_object, null, 2)}
                                                    </pre>
                                                </div>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button variant="outline" className="border-slate-200">
                                                            Close
                                                        </Button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    ) : (
                                        <span className="text-slate-400 text-sm">No JD data</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button size="sm" variant="outline" className="border-slate-200 hover:bg-slate-50">
                                                    <Upload className="w-4 h-4 mr-2" />
                                                    {position.jd_text && position.jd_text.trim() !== "" ? "Update JD" : "Upload JD"}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[500px]">
                                                <DialogHeader>
                                                    <DialogTitle className="text-xl font-semibold text-slate-900">
                                                        Upload Job Description
                                                    </DialogTitle>
                                                    <DialogDescription className="text-slate-600">
                                                        Upload a job description file for {position.name}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="jdfile" className="text-sm font-medium text-slate-700">
                                                            Job Description File
                                                        </Label>
                                                        <Input
                                                            id="jdfile"
                                                            type="file"
                                                            accept=".pdf,.doc,.docx"
                                                            onChange={e => {
                                                                const file = e.target.files && e.target.files[0] ? e.target.files[0] : null
                                                                onChangeJdFile(file)
                                                            }}
                                                            className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                                        />
                                                        <p className="text-xs text-slate-500">
                                                            Supported formats: PDF, DOC, DOCX
                                                        </p>
                                                    </div>
                                                </div>
                                                <DialogFooter className="gap-3">
                                                    <DialogClose asChild>
                                                        <Button variant="outline" type="button" className="border-slate-200">
                                                            Cancel
                                                        </Button>
                                                    </DialogClose>
                                                    <Button
                                                        onClick={() => onUploadJdFile(position._id)}
                                                        disabled={uploading === position._id}
                                                        className="bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        {uploading === position._id ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                Uploading...
                                                            </>
                                                        ) : (
                                                            'Upload File'
                                                        )}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-12">
                                <div className="space-y-3">
                                    <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
                                        <Building2 className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <div className="text-slate-500">
                                        <p className="font-medium">No positions found</p>
                                        <p className="text-sm">Create your first position to get started</p>
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
