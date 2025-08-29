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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import axios from "axios"
import { Eye, Loader2, Users, Upload, Download, Plus } from "lucide-react"
import { useState } from "react"
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

interface CandidatesTableProps {
    candidates: any[]
    loading: boolean
}

interface Position {
    _id: string
    name: string
}

export function CandidatesTable({ candidates, loading }: CandidatesTableProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [positions, setPositions] = useState<Position[]>([])
    const [selectedPosition, setSelectedPosition] = useState<string>("")
    const [loadingPositions, setLoadingPositions] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [positionsLoaded, setPositionsLoaded] = useState(false)

    const fetchPositions = async () => {
        setLoadingPositions(true)
        try {
            const response = await await axios.get('/api/position')
            setPositions(response.data?.data)
            setPositionsLoaded(true)

        } catch (error) {
            console.error('Error fetching positions:', error)
        } finally {
            setLoadingPositions(false)
        }
    }

    const handleDialogOpen = (open: boolean) => {
        setIsDialogOpen(open)
        if (open && !positionsLoaded) {
            fetchPositions()
        }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (
            file &&
            (
                file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || // .xlsx
                file.type === 'application/vnd.ms-excel' || // .xls
                file.type === 'text/csv' || // .csv
                file.name.endsWith('.xlsx') ||
                file.name.endsWith('.xls') ||
                file.name.endsWith('.csv')
            )
        ) {
            setSelectedFile(file);
        } else {
            toast.error('Please select a valid Excel or CSV file (.xlsx, .xls, .csv)');
        }
    }

    const handleDownloadSample = () => {
        // Create sample Excel data
        const sampleData = [
            ['First Name', 'Last Name', 'Email Address', 'Contact Number'],
        ]

        // Convert to CSV format for download
        const csvContent = sampleData.map(row => row.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'sample_candidates.csv'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    }

    const handleSubmit = async () => {
        if (!selectedFile) {
            toast.error('Please select a file first')
            return
        }

        if (!selectedPosition) {
            toast.error('Please select a position first')
            return
        }

        setIsUploading(true)
        try {
            // Read the Excel file
            const reader = new FileReader()

            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer)
                    const workbook = XLSX.read(data, { type: 'array' })

                    // Get the first sheet
                    const sheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[sheetName]

                    // Convert sheet to JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

                    // Remove header row and filter out empty rows
                    const candidateData = jsonData.slice(1).filter((row: any) =>
                        row && row.length > 0 && row.some((cell: any) => cell !== null && cell !== undefined && cell !== '')
                    )

                    // Transform data to match expected format
                    const transformedData = candidateData.map((row: any) => ({
                        firstName: row[0] || '',
                        lastName: row[1] || '',
                        emailAddress: row[2] || '',
                        contactNumber: row[3] || ''
                    }))

                    // Send the extracted data to your API
                    const response = await axios.post('/api/candidate/bulk-invite', {
                        candidates: transformedData,
                        positionId: selectedPosition
                    })

                    if (response.data.success) {
                        toast.success('Candidates uploaded successfully!')
                        // Reset form
                        setSelectedFile(null)
                        setSelectedPosition("")
                        setIsDialogOpen(false)
                        // Optionally refresh the candidates list
                        // You might want to add a callback prop to refresh the parent component
                    } else {
                        toast.error('Error processing candidates: ' + response.data.message)
                    }

                } catch (error) {
                    console.error('Error processing Excel file:', error)
                    toast.error('Error processing the Excel file. Please check the file format.')
                } finally {
                    setIsUploading(false)
                }
            }

            reader.onerror = () => {
                toast.error('Error reading the file')
                setIsUploading(false)
            }

            reader.readAsArrayBuffer(selectedFile)

        } catch (error) {
            console.error('Error uploading file:', error)
            toast.error('Error uploading file')
            setIsUploading(false)
        }
    }

    return (
        <div className="space-y-4">
            {/* Header with Invite Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-900">Candidates</h2>
                <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Invite Candidates
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        {loadingPositions ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex items-center gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    <span className="text-slate-600">Loading positions...</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-semibold text-slate-900">
                                        Invite Candidates
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-600">
                                        Upload an Excel file with candidate information to invite multiple candidates at once.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    {/* Position Selection */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Select Position</label>
                                        <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Choose a position" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {positions.map((position) => (
                                                    <SelectItem key={position?._id} value={position?._id}>
                                                        {position.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* File Upload Section */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Upload Excel File</label>
                                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                                            <input
                                                type="file"
                                                accept=".xlsx,.xls,.csv"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                id="file-upload"
                                            />
                                            <label htmlFor="file-upload" className="cursor-pointer">
                                                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                                                <p className="text-sm text-slate-600">
                                                    {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Excel files only (.xlsx, .xls)
                                                </p>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Download Sample Button */}
                                    <div className="flex justify-center">
                                        <Button
                                            variant="outline"
                                            onClick={handleDownloadSample}
                                            className="border-slate-200 hover:bg-slate-50"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Sample Excel
                                        </Button>
                                    </div>
                                </div>

                                <DialogFooter className="gap-2">
                                    <DialogClose asChild>
                                        <Button variant="outline" className="border-slate-200">
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!selectedFile || !selectedPosition || isUploading}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            'Submit'
                                        )}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="border-slate-200 hover:bg-slate-50">
                            <TableHead className="font-semibold text-slate-700">Interview ID</TableHead>
                            <TableHead className="font-semibold text-slate-700">Candidate ID</TableHead>
                            <TableHead className="font-semibold text-slate-700">Name</TableHead>
                            <TableHead className="font-semibold text-slate-700">Email</TableHead>
                            <TableHead className="font-semibold text-slate-700">Contact</TableHead>
                            <TableHead className="font-semibold text-slate-700">Position</TableHead>
                            <TableHead className="font-semibold text-slate-700">Status</TableHead>
                            <TableHead className="font-semibold text-slate-700">Resume</TableHead>
                            <TableHead className="font-semibold text-slate-700">Created At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-12">
                                    <div className="flex items-center justify-center gap-3">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                        <span className="text-slate-600">Loading candidates...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : candidates.length > 0 ? (
                            candidates.map((candidate: any, idx: number) => (
                                <TableRow key={candidate.interview_id?.toString() || idx} className="border-slate-100 hover:bg-slate-50/50">
                                    <TableCell className="font-mono text-sm text-slate-600 relative group">
                                        <span>
                                            {candidate.interview_id ? candidate.interview_id.toString() : "-"}
                                        </span>
                                        {candidate.interview_id && (
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    className="ml-2 p-1 rounded hover:bg-slate-200 cursor-pointer"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            await navigator.clipboard.writeText(`http://localhost:3000?id=${candidate.interview_id}`);
                                                            // Use react-hot-toast for feedback
                                                            if (typeof window !== "undefined") {
                                                                // Dynamically import toast if not already in scope
                                                                const { toast } = await import('react-hot-toast');
                                                                toast.success('Interview ID copied!', { position: "top-right" });
                                                            }
                                                        } catch (err) {
                                                            if (typeof window !== "undefined") {
                                                                const { toast } = await import('react-hot-toast');
                                                                toast.error('Failed to copy Interview ID', { position: "top-right" });
                                                            }
                                                        }
                                                    }}
                                                    title="Copy Interview Link"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                                                        <rect x="3" y="3" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                                                    </svg>
                                                </button>
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm text-slate-600">
                                        {candidate.id ? candidate.id.toString().slice(-8) : "-"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-slate-900">{candidate.full_name || "-"}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-slate-600">{candidate.email_address || "-"}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-slate-600">{candidate.contact_number || "-"}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="border-slate-200 text-slate-700">
                                            {candidate.position_name || "-"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={candidate.interview_status === 'completed' ? 'default' : 'secondary'}
                                            className={candidate.interview_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                                        >
                                            {candidate.interview_status || 'pending'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {candidate.resume_object ? (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" variant="outline" className="border-slate-200 hover:bg-slate-50">
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View Resume
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[800px] max-h-[600px] overflow-y-auto">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-xl font-semibold text-slate-900">
                                                            Candidate Resume Data
                                                        </DialogTitle>
                                                        <DialogDescription className="text-slate-600">
                                                            Resume data for {candidate.full_name}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="py-4">
                                                        <pre className="bg-slate-50 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap break-words">
                                                            {JSON.stringify(candidate.resume_object, null, 2)}
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
                                            <span className="text-slate-400 text-sm">No resume data</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {candidate.interview_createdAt ? new Date(candidate.interview_createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            timeZone: 'UTC',
                                        }) : "-"}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-12">
                                    <div className="space-y-3">
                                        <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
                                            <Users className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <div className="text-slate-500">
                                            <p className="font-medium">No candidates found</p>
                                            <p className="text-sm">Candidates will appear here once they are assigned to positions</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
