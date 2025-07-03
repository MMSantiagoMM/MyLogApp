
import { Button } from "@/components/ui/button";
import { Coffee, ListChecks, TerminalSquare, Youtube } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 flex justify-between items-center border-b">
        <div className="flex items-center gap-2">
          <Coffee className="h-7 w-7 text-primary" />
          <span className="font-headline text-lg font-semibold text-foreground">
            My Logic App
          </span>
        </div>
        <nav className="flex gap-2">
          <Link href="/login" passHref>
            <Button variant="outline">Login</Button>
          </Link>
          <Link href="/signup" passHref>
            <Button>Sign Up</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-grow">
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 font-headline">
            The Ultimate Platform for Java Developers
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Compile code, manage resources, and sharpen your skills with our all-in-one web application. Built for learners and professionals alike.
          </p>
          <Link href="/signup" passHref>
            <Button size="lg">Get Started for Free</Button>
          </Link>
        </section>

        <section className="bg-muted py-20">
            <div className="container mx-auto px-4 text-center">
                 <h2 className="text-3xl font-bold mb-10 font-headline">Core Features</h2>
                 <div className="grid md:grid-cols-3 gap-8">
                    <div className="p-6 bg-card rounded-lg shadow-md">
                        <TerminalSquare className="w-12 h-12 text-primary mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Online Java Editor</h3>
                        <p className="text-muted-foreground">Write, compile, and run Java code instantly. Perfect for quick tests and learning.</p>
                    </div>
                    <div className="p-6 bg-card rounded-lg shadow-md">
                        <Youtube className="w-12 h-12 text-primary mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Video Hub</h3>
                        <p className="text-muted-foreground">Organize and watch your favorite educational YouTube videos without leaving the app.</p>
                    </div>
                    <div className="p-6 bg-card rounded-lg shadow-md">
                        <ListChecks className="w-12 h-12 text-primary mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Coding Exercises</h3>
                        <p className="text-muted-foreground">Tackle a variety of coding challenges to hone your problem-solving skills.</p>
                    </div>
                 </div>
            </div>
        </section>
      </main>
      <footer className="text-center p-4 border-t">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} My Logic App. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
