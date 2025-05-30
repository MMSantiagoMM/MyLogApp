import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { mockExercises, ExerciseData } from '@/lib/data'; // Using mock data
import { BookMarked, FileCode, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ExercisesPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Exercises</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <BookMarked className="w-6 h-6" />
            Available Exercises
          </CardTitle>
          <CardDescription>
            Browse through the list of available Java exercises. Click on an exercise to see more details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mockExercises.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookMarked className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No exercises available at the moment.</p>
              <p>Please check back later for new challenges.</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {mockExercises.map((exercise: ExerciseData) => (
                <AccordionItem value={`exercise-${exercise.id}`} key={exercise.id}>
                  <AccordionTrigger className="font-medium text-lg hover:bg-accent/50 px-4 rounded-md">
                    <div className="flex items-center gap-3">
                      <FileCode className="w-5 h-5 text-primary" />
                      {exercise.title}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4 space-y-3 bg-muted/30 rounded-b-md">
                    <p className="text-muted-foreground">{exercise.description}</p>
                    {exercise.difficulty && (
                       <div className="flex items-center gap-2">
                         <Clock className="w-4 h-4 text-muted-foreground" />
                         <Badge variant={
                           exercise.difficulty.toLowerCase() === 'easy' ? 'default' :
                           exercise.difficulty.toLowerCase() === 'medium' ? 'secondary' :
                           'destructive'
                         } className="capitalize bg-opacity-70">
                           {exercise.difficulty}
                         </Badge>
                       </div>
                    )}
                    {exercise.files && exercise.files.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-1">Associated Files:</h4>
                        <ul className="list-disc list-inside pl-2">
                          {exercise.files.map((file, index) => (
                            <li key={index} className="text-sm text-primary hover:underline">
                              {/* In a real app, these would be links to the file repository */}
                              <a href="#" onClick={(e) => e.preventDefault()}>{file}</a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Link href="/editor" passHref>
                       <Button variant="outline" size="sm" className="mt-2">
                         Go to Editor
                       </Button>
                    </Link>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
