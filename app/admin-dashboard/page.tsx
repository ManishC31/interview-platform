'use client'
import { Button } from "@/components/ui/button";
import { IPosition } from "@/models/position.model";
import axios from "axios";
import { useEffect, useState } from "react";
import { Toaster, toast } from 'react-hot-toast'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Footer } from "@/components/custom-components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Upload, Building2, Calendar, Hash, Loader2, FileText, Eye, Users, UserCheck } from "lucide-react"
import { PositionsTable } from "@/components/custom-components/PositionsTable"
import { CandidatesTable } from "@/components/custom-components/CandidatesTable"

export default function AdminDashboard() {
    const [positions, setPositions] = useState<IPosition>()
    const [candidates, setCandidates] = useState<any[]>([])
    const [jdFile, setJdFile] = useState<any>()
    const [loading, setLoading] = useState(false)
    const [candidatesLoading, setCandidatesLoading] = useState(false)
    const [uploading, setUploading] = useState<string | null>(null)
    const [creating, setCreating] = useState(false)
    const [activeTab, setActiveTab] = useState<'positions' | 'candidates'>('positions')
    const [newPosition, setNewPosition] = useState({
        name: "",
        organization_id: "",
    })

    const getPositions = async () => {
        setLoading(true)
        try {
            const response = await axios.get('/api/position')
            console.log('response:', response.data.data)
            setPositions(response?.data?.data)
        } catch (error) {
            console.log('err in getPositions:', error)
            toast.error('Failed to load positions')
        } finally {
            setLoading(false)
        }
    }

    const getCandidates = async () => {
        setCandidatesLoading(true)
        try {
            const response = await axios.get('/api/candidate')
            console.log('candidates response:', response)
            setCandidates(response?.data?.data || [])
        } catch (error) {
            console.log('err in getCandidates:', error)
            toast.error('Failed to load candidates')
        } finally {
            setCandidatesLoading(false)
        }
    }

    const handleNewPosition = async (e: React.FormEvent) => {
        e.preventDefault()

        console.log('inside handle new position')

        if (newPosition.name === "" || newPosition.organization_id === "") {
            toast.error('Fill details first')
            return
        }
        setCreating(true)
        try {
            const response = await axios.post('/api/position', newPosition)
            toast.success('Position created!')
            setNewPosition({ name: "", organization_id: "" })
            getPositions()
        } catch (error) {
            toast.error('Error creating position')
        } finally {
            setCreating(false)
        }
    }

    const uploadJdFile = async (id: string) => {
        const formData = new FormData();
        formData.append("file", jdFile);
        formData.append("position_id", id)

        setUploading(id)
        try {
            const response = await fetch("/api/position/job-description", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                toast.error(errorData.error || "Failed to upload file");
                return;
            }

            const data = await response.json();
            toast.success("File uploaded successfully!");
        } catch (error) {
            toast.error("Error uploading file");
        } finally {
            setUploading(null)
        }
    }

    useEffect(() => {
        getPositions()
        getCandidates()
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <Toaster />
            <div className="container mx-auto px-6 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                                Admin Dashboard
                            </h1>
                            <p className="text-slate-600 text-lg">
                                Manage positions and candidates for your interview platform
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {activeTab === 'positions' && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Position
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[500px]">
                                        <form onSubmit={handleNewPosition}>
                                            <DialogHeader>
                                                <DialogTitle className="text-2xl font-semibold text-slate-900">
                                                    Create New Position
                                                </DialogTitle>
                                                <DialogDescription className="text-slate-600">
                                                    Add a new position to your organization. You can upload the job description later.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-6 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name-1" className="text-sm font-medium text-slate-700">
                                                        Position Name
                                                    </Label>
                                                    <Input
                                                        id="name-1"
                                                        name="name"
                                                        placeholder="e.g., Senior Software Engineer"
                                                        value={newPosition.name}
                                                        onChange={e => setNewPosition({ ...newPosition, name: e.target.value })}
                                                        className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="org-id-1" className="text-sm font-medium text-slate-700">
                                                        Organization ID
                                                    </Label>
                                                    <Input
                                                        id="org-id-1"
                                                        name="org-id"
                                                        placeholder="Enter organization identifier"
                                                        value={newPosition.organization_id}
                                                        onChange={e => setNewPosition({ ...newPosition, organization_id: e.target.value })}
                                                        className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter className="gap-3">
                                                <DialogClose asChild>
                                                    <Button variant="outline" type="button" className="border-slate-200">
                                                        Cancel
                                                    </Button>
                                                </DialogClose>
                                                <Button type="submit" disabled={creating} className="bg-blue-600 hover:bg-blue-700">
                                                    {creating ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Creating...
                                                        </>
                                                    ) : (
                                                        'Create Position'
                                                    )}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="border-b border-slate-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('positions')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'positions'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    Positions
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('candidates')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'candidates'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Candidates
                                </div>
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                <Hash className="w-4 h-4" />
                                Total Positions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span className="text-lg">Loading...</span>
                                    </div>
                                ) : (
                                    Array.isArray(positions) ? positions.length : 0
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Total Candidates
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">
                                {candidatesLoading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span className="text-lg">Loading...</span>
                                    </div>
                                ) : (
                                    candidates.length
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Organizations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span className="text-lg">Loading...</span>
                                    </div>
                                ) : (
                                    Array.isArray(positions) ? new Set(positions.map(p => p.organization_id)).size : 0
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Positions Section */}
                {activeTab === 'positions' && (
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold text-slate-900">
                                All Positions
                            </CardTitle>
                            <CardDescription>
                                Manage and view all positions in your system
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PositionsTable
                                positions={Array.isArray(positions) ? positions : []}
                                loading={loading}
                                uploading={uploading}
                                onUploadJdFile={uploadJdFile}
                                onChangeJdFile={(file) => setJdFile(file)}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Candidates Section */}
                {activeTab === 'candidates' && (
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold text-slate-900">
                                All Candidates
                            </CardTitle>
                            <CardDescription>
                                View and manage all candidates with assigned positions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CandidatesTable candidates={candidates} loading={candidatesLoading} />
                        </CardContent>
                    </Card>
                )}
            </div>
            {/* <Footer /> */}
        </div>
    )
}