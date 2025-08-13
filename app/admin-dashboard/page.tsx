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

export default function AdminDashboard() {
    const [positions, setPositions] = useState<IPosition>()
    const [jdFile, setJdFile] = useState<any>()
    const [newPosition, setNewPosition] = useState({
        name: "",
        organization_id: "",
    })

    const getPositions = async () => {
        try {
            const response = await axios.get('/api/position')
            console.log('response:', response.data.data)
            setPositions(response?.data?.data)
        } catch (error) {
            console.log('err in getPositions:', error)
        }
    }

    const handleNewPosition = async (e: React.FormEvent) => {
        e.preventDefault()

        console.log('inside handle new position')

        if (newPosition.name === "" || newPosition.organization_id === "") {
            toast.error('Fill details first')
            return
        }
        try {
            const response = await axios.post('/api/position', newPosition)
            toast.success('Position created!')
            setNewPosition({ name: "", organization_id: "" })
            getPositions()
        } catch (error) {
            toast.error('Error creating position')
        }
    }

    const uploadJdFile = async (id: string) => {
        const formData = new FormData();
        formData.append("file", jdFile);
        formData.append("position_id", id)

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
        }
    }



    useEffect(() => {
        getPositions()
    }, [])

    return (
        <div>
            <div className="h-screen">
                <Toaster />
                <div className="p-10">

                    <div className=" flex justify-between w-full">
                        <div>
                            <h3 className="text-3xl font-bold">All Positions</h3>
                            <p className="text-sm mt-2 text-secondary-foreground">List of all positions for interview platform</p>
                        </div>
                        <div>
                            {/* create position dialog */}
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button>Create Position</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <form onSubmit={handleNewPosition}>
                                        <DialogHeader>
                                            <DialogTitle>Add Position</DialogTitle>
                                            <DialogDescription>
                                                Create new position and upload job description later.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4">
                                            <div className="grid gap-3">
                                                <Label htmlFor="name-1">Position Name</Label>
                                                <Input
                                                    id="name-1"
                                                    name="name"
                                                    value={newPosition.name}
                                                    onChange={e => setNewPosition({ ...newPosition, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-3">
                                                <Label htmlFor="org-id-1">Organization Id</Label>
                                                <Input
                                                    id="org-id-1"
                                                    name="org-id"
                                                    value={newPosition.organization_id}
                                                    onChange={e => setNewPosition({ ...newPosition, organization_id: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter className="mt-4">
                                            <DialogClose asChild>
                                                <Button variant="outline" type="button">Cancel</Button>
                                            </DialogClose>
                                            <Button type="submit">Create Position</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>


                        </div>
                    </div>

                    {/* table */}
                    {/* Table for Positions using shadcn/ui Table components */}
                    <div className="mt-8">
                        <div className="overflow-x-auto rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Position Id</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Organization</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Array.isArray(positions) && positions.length > 0 ? (
                                        positions.map((position: any, idx: number) => (
                                            <TableRow key={position._id?.toString() || idx}>
                                                <TableCell>{position._id || "-"}</TableCell>
                                                <TableCell>{position.name || "-"}</TableCell>
                                                <TableCell>{position.organization_id || "-"}</TableCell>
                                                <TableCell>
                                                    {position.createdAt ? new Date(position.createdAt).toLocaleDateString('en-IN') : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button>Upload Job Description</Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-[425px]">
                                                            <Label htmlFor="jdfile">Job Description</Label>
                                                            <Input
                                                                id="jdfile"
                                                                type="file"
                                                                onChange={e => {
                                                                    if (e.target.files && e.target.files[0]) {
                                                                        setJdFile(e.target?.files[0]);
                                                                    }
                                                                }}
                                                            />
                                                            <DialogFooter>
                                                                <DialogClose asChild>
                                                                    <Button variant="outline" type="button">Cancel</Button>
                                                                </DialogClose>
                                                                <Button onClick={() => {
                                                                    uploadJdFile(position._id)
                                                                }}>Upload</Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-gray-400 text-sm py-8">
                                                No positions found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}