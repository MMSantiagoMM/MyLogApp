
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, where, Timestamp, orderBy } from 'firebase/firestore';
import type { Evaluation, Question, Answer, StudentSubmission, Group } from '@/lib/data';

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, PlusCircle, Trash2, Edit, CalendarIcon, AlertTriangle, BookCheck, CheckCircle, XCircle, ArrowLeft, Send, BarChart, PlayCircle } from 'lucide-react';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

// Main component that determines which view to show
export default function EvaluationsPage() {
    const { userData, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (userData?.role === 'profesor') {
        return <ProfessorEvaluationsView />;
    }
    
    if (userData?.role === 'estudiante') {
        return <StudentEvaluationsView />;
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-bold">Acceso Denegado</h2>
            <p className="text-muted-foreground max-w-lg">No tienes un rol asignado. Por favor, contacta a un administrador.</p>
        </div>
    );
}

// Professor's View Component
function ProfessorEvaluationsView() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null);

    const fetchEvaluations = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const q = query(collection(db, 'evaluations'), where('profesorId', '==', user.uid));
            const querySnapshot = await getDocs(q);
            const evalsList = querySnapshot.docs.map(doc => {
                const data = doc.data();
                const createdAt = data.createdAt as Timestamp;
                return {
                    id: doc.id,
                    ...data,
                    startDate: (data.startDate as Timestamp).toDate().toISOString(),
                    endDate: (data.endDate as Timestamp).toDate().toISOString(),
                    createdAt: createdAt?.toDate().toISOString() || new Date().toISOString(),
                } as Evaluation;
            });
            // Sort client-side to avoid composite index
            evalsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setEvaluations(evalsList);
        } catch (error) {
            console.error("Error fetching evaluations:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las evaluaciones.' });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchEvaluations();
    }, [fetchEvaluations]);

    const handleCreateNew = () => {
        setCurrentEvaluation(null);
        setView('create');
    };

    const handleEdit = (evaluation: Evaluation) => {
        setCurrentEvaluation(evaluation);
        setView('edit');
    };

    const handleBackToList = () => {
        setView('list');
        setCurrentEvaluation(null);
        fetchEvaluations(); // Refresh list
    };

    const handleDelete = async (evaluationId: string) => {
        try {
            await deleteDoc(doc(db, 'evaluations', evaluationId));
            toast({ title: "Éxito", description: "Evaluación eliminada correctamente." });
            fetchEvaluations();
        } catch (error) {
            console.error("Error deleting evaluation:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la evaluación.' });
        }
    };

    if (view === 'create' || (view === 'edit' && currentEvaluation)) {
        return <EvaluationForm existingEvaluation={currentEvaluation} onFinished={handleBackToList} />;
    }
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                    <BookCheck className="w-8 h-8 text-primary" />
                    Mis Evaluaciones
                </h1>
                <Button onClick={handleCreateNew}><PlusCircle className="mr-2 h-4 w-4" />Crear Evaluación</Button>
            </div>

            {isLoading ? (
                <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
            ) : evaluations.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">No has creado ninguna evaluación todavía.</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {evaluations.map(eva => (
                        <Card key={eva.id}>
                            <CardHeader>
                                <CardTitle>{eva.topic}</CardTitle>
                                <CardDescription>
                                    {eva.questions.length} preguntas | Válida del {format(parseISO(eva.startDate), 'dd/MM/yy')} al {format(parseISO(eva.endDate), 'dd/MM/yy')}
                                </CardDescription>
                            </CardHeader>
                            <CardFooter className="flex justify-end gap-2">
                                <AssignGroupsDialog evaluation={eva} onAssigned={fetchEvaluations} />
                                <Button variant="outline" size="sm" onClick={() => handleEdit(eva)}><Edit className="mr-2 h-4 w-4" />Editar</Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará la evaluación permanentemente.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(eva.id)}>Eliminar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

// Student's View Component
function StudentEvaluationsView() {
    const { user, userData } = useAuth();
    const { toast } = useToast();
    const [availableEvals, setAvailableEvals] = useState<Evaluation[]>([]);
    const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<'list' | 'take' | 'result'>('list');
    const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null);
    const [currentSubmission, setCurrentSubmission] = useState<StudentSubmission | null>(null);

    const fetchStudentData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // Fetch all active evaluations
            const now = new Date();
            const evalsQuery = query(collection(db, 'evaluations'));
            const evalsSnapshot = await getDocs(evalsQuery);
            const allEvals = evalsSnapshot.docs
                .map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        startDate: (data.startDate as Timestamp).toDate().toISOString(),
                        endDate: (data.endDate as Timestamp).toDate().toISOString(),
                        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
                    } as Evaluation;
                })
                .filter(eva => isBefore(now, parseISO(eva.endDate)) && isAfter(now, parseISO(eva.startDate)));

            // Fetch student's submissions
            const subsQuery = query(collection(db, 'submissions'), where('studentId', '==', user.uid));
            const subsSnapshot = await getDocs(subsQuery);
            const studentSubmissions = subsSnapshot.docs.map(doc => doc.data() as StudentSubmission);
            
            setSubmissions(studentSubmissions);

            // Filter out evaluations the student has already taken
            const submittedEvalIds = new Set(studentSubmissions.map(s => s.evaluationId));
            const available = allEvals.filter(eva => !submittedEvalIds.has(eva.id));
            
            setAvailableEvals(available);

        } catch (error) {
            console.error("Error fetching student data:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las evaluaciones disponibles.' });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchStudentData();
    }, [fetchStudentData]);

    const handleStartEvaluation = (evaluation: Evaluation) => {
        setCurrentEvaluation(evaluation);
        setView('take');
    };
    
    const handleShowResult = (submission: StudentSubmission) => {
        setCurrentSubmission(submission);
        setView('result');
    }

    const handleBackToList = () => {
        setView('list');
        setCurrentEvaluation(null);
        setCurrentSubmission(null);
        fetchStudentData();
    };

    if (view === 'take' && currentEvaluation) {
        return <TakeEvaluationForm evaluation={currentEvaluation} onFinished={handleBackToList} />;
    }
    
    if (view === 'result' && currentSubmission) {
        return <EvaluationResultView submission={currentSubmission} onBack={handleBackToList} />;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                <BookCheck className="w-8 h-8 text-primary" />
                Evaluaciones Disponibles
            </h1>
            {isLoading ? (
                <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
            ) : (
                <>
                    {availableEvals.length === 0 && submissions.length === 0 && (
                        <p className="text-muted-foreground text-center py-10">No hay evaluaciones disponibles en este momento.</p>
                    )}
                    {availableEvals.length > 0 && (
                         <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Pendientes</h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {availableEvals.map(eva => (
                                    <Card key={eva.id}>
                                        <CardHeader>
                                            <CardTitle>{eva.topic}</CardTitle>
                                            <CardDescription>{eva.questions.length} preguntas</CardDescription>
                                        </CardHeader>
                                        <CardFooter>
                                            <Button className="w-full" onClick={() => handleStartEvaluation(eva)}>
                                                <PlayCircle className="mr-2 h-4 w-4" /> Iniciar Evaluación
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                    {submissions.length > 0 && (
                        <div className="space-y-4 pt-6">
                            <h2 className="text-xl font-semibold">Completadas</h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {submissions.map(sub => (
                                    <Card key={sub.id}>
                                        <CardHeader>
                                            <CardTitle>{sub.evaluationTopic}</CardTitle>
                                            <CardDescription>Entregada el {format(parseISO(sub.submittedAt), 'dd/MM/yyyy')}</CardDescription>
                                        </CardHeader>
                                        <CardFooter className="flex justify-between items-center">
                                            <span className="font-bold text-lg">Calificación: {sub.score.toFixed(2)}</span>
                                            <Button variant="outline" onClick={() => handleShowResult(sub)}>
                                                <BarChart className="mr-2 h-4 w-4" /> Ver Resultado
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}


// Shared form for creating/editing evaluations
function EvaluationForm({ existingEvaluation, onFinished }: { existingEvaluation: Evaluation | null, onFinished: () => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [topic, setTopic] = useState(existingEvaluation?.topic || '');
    const [startDate, setStartDate] = useState<Date | undefined>(existingEvaluation ? parseISO(existingEvaluation.startDate) : new Date());
    const [endDate, setEndDate] = useState<Date | undefined>(existingEvaluation ? parseISO(existingEvaluation.endDate) : undefined);
    const [questions, setQuestions] = useState<Question[]>(existingEvaluation?.questions || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const addQuestion = () => {
        setQuestions([...questions, { id: uuidv4(), text: '', answers: [{ id: uuidv4(), text: '', isCorrect: true }] }]);
    };

    const removeQuestion = (qIndex: number) => {
        setQuestions(questions.filter((_, index) => index !== qIndex));
    };

    const handleQuestionTextChange = (qIndex: number, text: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].text = text;
        setQuestions(newQuestions);
    };

    const addAnswer = (qIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].answers.push({ id: uuidv4(), text: '', isCorrect: false });
        setQuestions(newQuestions);
    };
    
    const removeAnswer = (qIndex: number, aIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].answers = newQuestions[qIndex].answers.filter((_, index) => index !== aIndex);
        setQuestions(newQuestions);
    };
    
    const handleAnswerTextChange = (qIndex: number, aIndex: number, text: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].answers[aIndex].text = text;
        setQuestions(newQuestions);
    };
    
    const handleCorrectAnswerChange = (qIndex: number, aIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].answers.forEach((ans, index) => {
            ans.isCorrect = index === aIndex;
        });
        setQuestions(newQuestions);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!topic.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'El tema no puede estar vacío.' });
            return;
        }
        if (!startDate || !endDate) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes seleccionar una fecha de inicio y fin.' });
            return;
        }
        if (questions.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'La evaluación debe tener al menos una pregunta.' });
            return;
        }
        // Add more validation here (e.g., questions/answers not empty)

        setIsSubmitting(true);
        
        const evaluationData = {
            profesorId: user.uid,
            topic,
            startDate: Timestamp.fromDate(startDate),
            endDate: Timestamp.fromDate(endDate),
            questions,
            assignedGroupIds: existingEvaluation?.assignedGroupIds || [],
        };

        try {
            if (existingEvaluation) {
                await updateDoc(doc(db, 'evaluations', existingEvaluation.id), evaluationData);
                toast({ title: 'Éxito', description: 'Evaluación actualizada correctamente.' });
            } else {
                await addDoc(collection(db, 'evaluations'), { ...evaluationData, createdAt: serverTimestamp() });
                toast({ title: 'Éxito', description: 'Evaluación creada correctamente.' });
            }
            onFinished();
        } catch (error) {
            console.error("Error saving evaluation:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la evaluación.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold font-headline">{existingEvaluation ? 'Editar' : 'Crear'} Evaluación</h1>
                    <p className="text-muted-foreground">Define el tema, las fechas y las preguntas para tu evaluación.</p>
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={onFinished} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Información General</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-2">
                        <Label htmlFor="topic">Tema de la Evaluación</Label>
                        <Input id="topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ej: Fundamentos de Java" required/>
                    </div>
                     <div className="space-y-2">
                        <Label>Fecha de Inicio</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "PPP") : <span>Selecciona una fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label>Fecha de Fin</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "PPP") : <span>Selecciona una fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
            </Card>

            <div>
                <h2 className="text-2xl font-bold font-headline mb-4">Preguntas</h2>
                <div className="space-y-6">
                    {questions.map((q, qIndex) => (
                        <Card key={q.id}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">Pregunta {qIndex + 1}</CardTitle>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(qIndex)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea value={q.text} onChange={e => handleQuestionTextChange(qIndex, e.target.value)} placeholder="Escribe el enunciado de la pregunta..."/>
                                
                                <RadioGroup 
                                    value={q.answers.find(a => a.isCorrect)?.id}
                                    onValueChange={(value) => {
                                        const newCorrectIndex = q.answers.findIndex(a => a.id === value);
                                        if (newCorrectIndex !== -1) {
                                            handleCorrectAnswerChange(qIndex, newCorrectIndex);
                                        }
                                    }}
                                >
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-sm text-muted-foreground">Respuestas (marca la opción correcta)</h4>
                                        {q.answers.map((ans, aIndex) => (
                                            <div key={ans.id} className="flex items-center gap-2">
                                                <RadioGroupItem value={ans.id} id={`q-${q.id}-a-${ans.id}`} />
                                                <Label htmlFor={`q-${q.id}-a-${ans.id}`} className="flex-grow">
                                                    <Input value={ans.text} onChange={e => handleAnswerTextChange(qIndex, aIndex, e.target.value)} className="w-full" placeholder={`Opción ${aIndex + 1}`} />
                                                </Label>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeAnswer(qIndex, aIndex)} disabled={q.answers.length <= 1}>
                                                    <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive"/>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                                
                                <Button type="button" variant="outline" size="sm" onClick={() => addAnswer(qIndex)}>
                                    <PlusCircle className="mr-2 h-4 w-4"/>Añadir Opción
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                    <Button type="button" onClick={addQuestion} className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4"/>Añadir Pregunta
                    </Button>
                </div>
            </div>
        </form>
    )
}

// Dialog to assign an evaluation to groups
function AssignGroupsDialog({ evaluation, onAssigned }: { evaluation: Evaluation, onAssigned: () => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set(evaluation.assignedGroupIds));
    const [isLoading, setIsLoading] = useState(true);

    const fetchGroups = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const q = query(collection(db, 'groups'), where('profesorId', '==', user.uid));
            const querySnapshot = await getDocs(q);
            const groupsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
            setGroups(groupsList);
        } catch (error) {
            console.error("Error fetching groups:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los grupos.' });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);
    
    const handleToggleGroup = (groupId: string) => {
        const newSelection = new Set(selectedGroupIds);
        if (newSelection.has(groupId)) {
            newSelection.delete(groupId);
        } else {
            newSelection.add(groupId);
        }
        setSelectedGroupIds(newSelection);
    };

    const handleSaveAssignments = async () => {
        try {
            const evalRef = doc(db, 'evaluations', evaluation.id);
            await updateDoc(evalRef, { assignedGroupIds: Array.from(selectedGroupIds) });
            toast({ title: 'Éxito', description: 'Asignación de grupos actualizada.' });
            onAssigned();
        } catch (error) {
            console.error("Error assigning groups:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la asignación.' });
        }
    };

    return (
        <Dialog onOpenChange={(open) => open && fetchGroups()}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Asignar Grupos</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Asignar "{evaluation.topic}" a Grupos</DialogTitle>
                    <DialogDescription>Selecciona los grupos que podrán realizar esta evaluación.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    {isLoading ? <Loader2 className="animate-spin mx-auto" /> :
                     groups.length === 0 ? <p className="text-sm text-muted-foreground">No tienes grupos creados.</p> :
                     groups.map(group => (
                        <div key={group.id} className="flex items-center space-x-2">
                            <Checkbox id={`group-${group.id}`} checked={selectedGroupIds.has(group.id)} onCheckedChange={() => handleToggleGroup(group.id)}/>
                            <Label htmlFor={`group-${group.id}`} className="font-normal">{group.name}</Label>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                    <DialogClose asChild><Button onClick={handleSaveAssignments}>Guardar Cambios</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


// Form for student to take an evaluation
function TakeEvaluationForm({ evaluation, onFinished }: { evaluation: Evaluation, onFinished: () => void }) {
    const { user, userData } = useAuth();
    const { toast } = useToast();
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAnswerSelect = (questionId: string, answerId: string) => {
        setSelectedAnswers(prev => ({ ...prev, [questionId]: answerId }));
    };

    const handleSubmit = async () => {
        if (Object.keys(selectedAnswers).length !== evaluation.questions.length) {
            toast({ variant: 'destructive', title: 'Atención', description: 'Debes responder todas las preguntas.' });
            return;
        }
        if (!user || !userData) return;
        
        setIsSubmitting(true);

        let correctAnswersCount = 0;
        evaluation.questions.forEach(q => {
            const correctAnswer = q.answers.find(a => a.isCorrect);
            if (correctAnswer && selectedAnswers[q.id] === correctAnswer.id) {
                correctAnswersCount++;
            }
        });

        const rawScore = (correctAnswersCount / evaluation.questions.length) * 4 + 1;
        const finalScore = Math.max(1, Math.min(5, rawScore));

        const submissionData: Omit<StudentSubmission, 'id' | 'submittedAt'> = {
            studentId: user.uid,
            studentName: userData.email || 'Estudiante Anónimo',
            evaluationId: evaluation.id,
            evaluationTopic: evaluation.topic,
            groupId: '', // This needs a proper way to be identified in the future
            selectedAnswers,
            score: finalScore,
            totalQuestions: evaluation.questions.length,
            correctAnswersCount,
        };
        
        try {
            await addDoc(collection(db, 'submissions'), { ...submissionData, submittedAt: serverTimestamp() });
            toast({ title: '¡Evaluación enviada!', description: 'Tu calificación ha sido registrada.' });
            onFinished();
        } catch (error) {
            console.error("Error submitting evaluation:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar tu evaluación.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold font-headline">{evaluation.topic}</h1>
                <Button variant="outline" onClick={onFinished}><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>
            </div>
            <div className="space-y-8">
                {evaluation.questions.map((q, index) => (
                    <Card key={q.id}>
                        <CardHeader>
                            <CardTitle>Pregunta {index + 1}</CardTitle>
                            <CardDescription>{q.text}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup value={selectedAnswers[q.id]} onValueChange={(value) => handleAnswerSelect(q.id, value)}>
                                <div className="space-y-2">
                                    {q.answers.map(ans => (
                                        <div key={ans.id} className="flex items-center space-x-2">
                                            <RadioGroupItem value={ans.id} id={`q-${q.id}-a-${ans.id}`} />
                                            <Label htmlFor={`q-${q.id}-a-${ans.id}`} className="font-normal">{ans.text}</Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button className="w-full" size="lg"><Send className="mr-2 h-4 w-4" />Enviar Evaluación</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro de enviar tus respuestas?</AlertDialogTitle>
                        <AlertDialogDescription>Una vez enviada, no podrás cambiar tus respuestas. Asegúrate de haber respondido todo.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            Confirmar y Enviar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// Component to show the student their result
function EvaluationResultView({ submission, onBack }: { submission: StudentSubmission, onBack: () => void }) {
    const percentage = (submission.correctAnswersCount / submission.totalQuestions) * 100;

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
             <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold font-headline">Resultado: {submission.evaluationTopic}</h1>
                <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />Volver a la lista</Button>
            </div>
            <Card className="text-center p-8">
                <CardHeader>
                    <CardDescription>Tu calificación final</CardDescription>
                    <CardTitle className="text-6xl text-primary">{submission.score.toFixed(2)}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg">Respondiste correctamente <span className="font-bold">{submission.correctAnswersCount}</span> de <span className="font-bold">{submission.totalQuestions}</span> preguntas.</p>
                    <p className="text-muted-foreground">({percentage.toFixed(0)}% de acierto)</p>
                </CardContent>
            </Card>
        </div>
    )
}
