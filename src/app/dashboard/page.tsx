import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, Lightbulb, BookOpen, Users, TerminalSquare, Youtube } from "lucide-react"; // Added Youtube
import Image from "next/image";
import { Link } from "@/navigation";

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <section className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 font-headline">Welcome to My Logic App</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your platform for compiling Java code, managing video links, and tackling coding exercises.
        </p>
      </section>

      <section className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
        <FeatureCard
          icon={<TerminalSquare className="w-10 h-10 text-primary" />}
          title="Online Java Editor"
          description="Write, compile, and run Java code directly in your browser. Get instant feedback and debug effectively."
          link="/editor"
          linkText="Try the Editor"
        />
        <FeatureCard
          icon={<Youtube className="w-10 h-10 text-primary" />}
          title="Video Hub"
          description="Collect and watch your favorite YouTube videos. Add links and play them directly."
          link="/files"
          linkText="Open Video Hub"
        />
        <FeatureCard
          icon={<ListChecks className="w-10 h-10 text-primary" />}
          title="Practice Exercises"
          description="Access a curated list of coding exercises to sharpen your Java skills and track your progress."
          link="/exercises"
          linkText="View Exercises"
        />
      </section>
      
      <section className="bg-card p-8 rounded-lg shadow-lg flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1">
          <h2 className="text-3xl font-bold mb-4 font-headline">Ready to Elevate Your Coding Journey?</h2>
          <p className="text-muted-foreground mb-6">
            My Logic App is designed to provide a seamless and productive environment for students and developers. 
            Start exploring the features and make the most of your learning experience.
          </p>
          <Link href="/editor"> 
            <Button size="lg">Get Started</Button>
          </Link>
        </div>
        <div className="flex-shrink-0">
          <Image 
            src="https://placehold.co/400x300.png" 
            alt="Coding illustration" 
            width={400} 
            height={300} 
            className="rounded-lg"
            data-ai-hint="coding computer" 
          />
        </div>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  linkText: string;
}

function FeatureCard({ icon, title, description, link, linkText }: FeatureCardProps) {
  return (
    <Card className="hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="items-center">
        {icon}
        <CardTitle className="mt-4 font-headline">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground mb-4">{description}</p>
        <Link href={link}>
          <Button variant="outline">{linkText}</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
