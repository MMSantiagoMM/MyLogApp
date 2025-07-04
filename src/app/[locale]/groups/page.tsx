
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp, query, where, writeBatch, Timestamp } from 'firebase/firestore';
import type { Group, Student } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Users, CalendarIcon, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function GroupsPage() {
    const { user, userData } = useAuth();
    const isProfesor = userData?.role === 'profesor';
    const { toast } = useToast();

    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [newGroupName, setNewGroupName] = useState('');
    const [newStudentName, setNewStudentName] = useState('');

    const [attendanceDate, setAttendanceDate] = useState<Date | undefined>(new Date());
    const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'present' | 'absent' | 'excused'>>({});

    const fetchGroups = useCallback(async () => {
        if (!isProfesor || !user) return;
        setIsLoading(true);
        try {
            const groupsCollection = collection(db, 'groups');
            // The orderBy clause is removed to avoid needing a composite index. Sorting is done on the client.
            const q = query(groupsCollection, where('profesorId', '==', user.uid));
            const groupSnapshot = await getDocs(q);

            const groupsList: Group[] = groupSnapshot.docs.map(doc => {
                const data = doc.data();
                const createdAt = data.createdAt as Timestamp; // Firestore returns a Timestamp object
                return {
                    id: doc.id,
                    name: data.name,
                    profesorId: data.profesorId,
                    // Convert Timestamp to an ISO string for consistent handling
                    createdAt: createdAt?.toDate().toISOString() || new Date().toISOString(),
                };
            });

            // Sort the groups by creation date on the client-side
            groupsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setGroups(groupsList);
            if (groupsList.length > 0) {
                // Use functional update to avoid stale state from closure
                setSelectedGroupId(prevId => prevId ? prevId : groupsList[0].id);
            }
        } catch (error) {
            console.error("Error fetching groups:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch groups.' });
        } finally {
            setIsLoading(false);
        }
    }, [isProfesor, user, toast]);

    const fetchStudents = useCallback(async () => {
        if (!selectedGroupId) {
            setStudents([]);
            return;
        };
        setIsLoading(true);
        try {
            const studentsCollection = collection(db, 'groups', selectedGroupId, 'students');
            const q = query(studentsCollection, orderBy('name'));
            const studentSnapshot = await getDocs(q);
            const studentList = studentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
            setStudents(studentList);
        } catch (error) {
            console.error("Error fetching students:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch students.' });
        } finally {
            setIsLoading(false);
        }
    }, [selectedGroupId, toast]);

    useEffect(() => {
        if (isProfesor) {
            fetchGroups();
        } else {
            setIsLoading(false);
        }
    }, [isProfesor, fetchGroups]);

    useEffect(() => {
        if (selectedGroupId) {
            fetchStudents();
        }
    }, [selectedGroupId, fetchStudents]);
    
    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || !user) return;
        setIsSubmitting(true);
        try {
            const newGroupRef = await addDoc(collection(db, 'groups'), {
                name: newGroupName,
                profesorId: user.uid,
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Group Created', description: `"${newGroupName}" has been created.` });
            setNewGroupName('');
            await fetchGroups();
            setSelectedGroupId(newGroupRef.id);
        } catch (error) {
            console.error("Error creating group:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not create group.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleAddStudent = async () => {
        if (!newStudentName.trim() || !selectedGroupId) return;
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'groups', selectedGroupId, 'students'), {
                name: newStudentName,
                grades: { m1: [null, null, null], m2: [null, null, null], m3: [null, null, null] },
                attendance: {},
            });
            toast({ title: 'Student Added', description: `"${newStudentName}" has been added to the group.` });
            setNewStudentName('');
            fetchStudents();
        } catch (error) {
            console.error("Error adding student:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not add student.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGradeChange = async (studentId: string, momento: 'm1' | 'm2' | 'm3', gradeIndex: number, value: string) => {
        const grade = value === '' ? null : Number(value);
        if (value !== '' && (isNaN(grade as any) || (grade as any) < 0 || (grade as any) > 10)) {
            toast({ variant: 'destructive', title: 'Invalid Grade', description: 'Grade must be a number between 0 and 10.' });
            return;
        }

        const updatedStudents = students.map(s => {
            if (s.id === studentId) {
                const newGrades = { ...s.grades };
                newGrades[momento][gradeIndex] = grade;
                return { ...s, grades: newGrades };
            }
            return s;
        });
        setStudents(updatedStudents);

        const studentRef = doc(db, 'groups', selectedGroupId, 'students', studentId);
        try {
            await updateDoc(studentRef, { [`grades.${momento}`]: updatedStudents.find(s => s.id === studentId)?.grades[momento] });
        } catch (error) {
             console.error("Error updating grade:", error);
             toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not save the grade.' });
             fetchStudents(); // Revert UI on failure
        }
    };

    const handleSaveAttendance = async () => {
        if (!attendanceDate || !selectedGroupId) return;
        setIsSubmitting(true);
        const dateString = format(attendanceDate, 'yyyy-MM-dd');
        const batch = writeBatch(db);

        students.forEach(student => {
            const status = attendanceRecords[student.id];
            if (status) {
                const studentRef = doc(db, 'groups', selectedGroupId, 'students', student.id);
                batch.update(studentRef, { [`attendance.${dateString}`]: status });
            }
        });

        try {
            await batch.commit();
            toast({ title: 'Attendance Saved', description: `Attendance for ${format(attendanceDate, 'PPP')} has been saved.` });
            fetchStudents(); // Refresh data
        } catch (error) {
            console.error("Error saving attendance:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save attendance.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openAttendanceDialog = () => {
        const dateString = attendanceDate ? format(attendanceDate, 'yyyy-MM-dd') : '';
        const initialAttendance: Record<string, 'present' | 'absent' | 'excused'> = {};
        students.forEach(s => {
            initialAttendance[s.id] = s.attendance[dateString] || 'present';
        });
        setAttendanceRecords(initialAttendance);
    };

    if (isLoading && !user) {
         return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!isProfesor) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-muted-foreground max-w-lg">This page is only available for professors. Please contact an administrator if you believe this is an error.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                <Users className="w-8 h-8 text-primary" />
                Group Management
            </h1>

            <Card>
                <CardHeader>
                    <CardTitle>Select or Create Group</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4 items-end">
                    <div className="flex-grow space-y-2">
                        <label htmlFor="group-select" className="text-sm font-medium">Select a Group</label>
                        <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={isLoading}>
                            <SelectTrigger id="group-select">
                                <SelectValue placeholder="Select a group..." />
                            </SelectTrigger>
                            <SelectContent>
                                {groups.map(group => (
                                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button><PlusCircle className="mr-2 h-4 w-4" />Create New Group</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create a New Group</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2 py-4">
                                <label htmlFor="new-group-name">Group Name</label>
                                <Input id="new-group-name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="e.g., Morning Java Class" />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">Cancel</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Button onClick={handleCreateGroup} disabled={isSubmitting || !newGroupName.trim()}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
                                    </Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>

            {selectedGroupId ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Students in "{groups.find(g => g.id === selectedGroupId)?.name}"</CardTitle>
                        <CardDescription>Manage grades and attendance for this group.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4 items-end mb-6">
                            <div className="flex-grow space-y-2">
                                <label htmlFor="new-student-name" className="text-sm font-medium">Add New Student</label>
                                <Input id="new-student-name" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} placeholder="Enter student's full name" />
                            </div>
                            <Button onClick={handleAddStudent} disabled={isSubmitting || !newStudentName.trim()}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Student
                            </Button>
                        </div>
                        
                        <div className="flex justify-end mb-4">
                            <Dialog onOpenChange={(open) => open && openAttendanceDialog()}>
                                <DialogTrigger asChild>
                                    <Button variant="outline"><CalendarIcon className="mr-2 h-4 w-4"/>Take Attendance</Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Take Attendance</DialogTitle>
                                        <DialogDescription>Mark attendance for the selected date.</DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4 space-y-4">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn("w-full justify-start text-left font-normal", !attendanceDate && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {attendanceDate ? format(attendanceDate, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={attendanceDate} onSelect={setAttendanceDate} initialFocus/>
                                            </PopoverContent>
                                        </Popover>
                                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                            {students.map(student => (
                                                <div key={student.id} className="flex justify-between items-center p-2 border rounded-md">
                                                    <span>{student.name}</span>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox id={`present-${student.id}`} checked={attendanceRecords[student.id] === 'present'} onCheckedChange={(checked) => checked && setAttendanceRecords(prev => ({ ...prev, [student.id]: 'present' }))}/>
                                                            <label htmlFor={`present-${student.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">P</label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox id={`absent-${student.id}`} checked={attendanceRecords[student.id] === 'absent'} onCheckedChange={(checked) => checked && setAttendanceRecords(prev => ({ ...prev, [student.id]: 'absent' }))}/>
                                                            <label htmlFor={`absent-${student.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">A</label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox id={`excused-${student.id}`} checked={attendanceRecords[student.id] === 'excused'} onCheckedChange={(checked) => checked && setAttendanceRecords(prev => ({ ...prev, [student.id]: 'excused' }))}/>
                                                            <label htmlFor={`excused-${student.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">E</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button type="button" variant="secondary">Cancel</Button>
                                        </DialogClose>
                                        <DialogClose asChild>
                                        <Button onClick={handleSaveAttendance} disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Attendance
                                        </Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="overflow-x-auto">
                            <Table className="min-w-max">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="sticky left-0 bg-card z-10 w-[200px]">Student Name</TableHead>
                                        <TableHead colSpan={3} className="text-center border-l border-r">Momento 1</TableHead>
                                        <TableHead colSpan={3} className="text-center border-l border-r">Momento 2</TableHead>
                                        <TableHead colSpan={3} className="text-center border-l border-r">Momento 3</TableHead>
                                        <TableHead className="text-center">Attendance (P/A)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={11} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                                    ) : students.length === 0 ? (
                                         <TableRow><TableCell colSpan={11} className="h-24 text-center">No students in this group yet. Add one above.</TableCell></TableRow>
                                    ) : (
                                        students.map(student => (
                                            <TableRow key={student.id}>
                                                <TableCell className="font-medium sticky left-0 bg-card z-10 w-[200px] whitespace-nowrap">{student.name}</TableCell>
                                                {[...Array(3)].map((_, i) => (
                                                    <TableCell key={`m1-g${i}`} className={cn("p-2", i === 0 ? 'border-l' : '')}>
                                                        <Input type="number" min="0" max="10" step="0.1" value={student.grades.m1[i] ?? ''} onChange={e => handleGradeChange(student.id, 'm1', i, e.target.value)} className="w-20 text-center"/>
                                                    </TableCell>
                                                ))}
                                                {[...Array(3)].map((_, i) => (
                                                    <TableCell key={`m2-g${i}`} className={cn("p-2", i === 0 ? 'border-l' : '')}>
                                                        <Input type="number" min="0" max="10" step="0.1" value={student.grades.m2[i] ?? ''} onChange={e => handleGradeChange(student.id, 'm2', i, e.target.value)} className="w-20 text-center"/>
                                                    </TableCell>
                                                ))}
                                                 {[...Array(3)].map((_, i) => (
                                                    <TableCell key={`m3-g${i}`} className={cn("p-2", i === 0 ? 'border-l' : '', i === 2 ? 'border-r' : '')}>
                                                        <Input type="number" min="0" max="10" step="0.1" value={student.grades.m3[i] ?? ''} onChange={e => handleGradeChange(student.id, 'm3', i, e.target.value)} className="w-20 text-center"/>
                                                    </TableCell>
                                                ))}
                                                <TableCell className="text-center whitespace-nowrap p-2">
                                                    {Object.values(student.attendance).filter(s => s === 'present').length} / {Object.values(student.attendance).filter(s => s === 'absent').length}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="flex items-center justify-center h-48">
                    <CardContent className="text-center text-muted-foreground p-6">
                        <p className="font-semibold">No group selected</p>
                        <p>Please select a group above, or create a new one to begin.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

    
