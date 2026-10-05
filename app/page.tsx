import {
  ArrowRight,
  Bot,
  ClipboardCheck,
  FileSearch,
  FileText,
  Gauge,
  Layers,
  ListChecks,
  PenLine,
  ScanSearch,
  ShieldCheck,
  Target,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/landing/fade-in";
import { ProductPreview } from "@/components/landing/product-preview";
import { Button } from "@/components/ui/button";

const STEPS = [
  { icon: FileText, title: "Upload your resume", body: "PDF or Word. We read it the same way an applicant tracking system would." },
  { icon: Target, title: "Paste the job post", body: "We pick out the skills, tools and experience the employer is asking for." },
  { icon: Gauge, title: "See your score", body: "One overall score, broken down so you can see exactly where it comes from." },
  { icon: ScanSearch, title: "Spot the gaps", body: "Find the keywords and skills you're missing, plus any formatting that could trip up a parser." },
  { icon: ListChecks, title: "Know what to fix", body: "A short list of changes, starting with the ones that will make the biggest difference." },
  { icon: Wand2, title: "Polish and apply", body: "Get rewording ideas for your summary and bullet points, then do a final check before you send it." },
];

const FEATURES = [
  { icon: Layers, title: "A score you can follow", body: "Job fit, keywords, skills, experience, formatting and overall quality each count toward the total. Nothing is a black box." },
  { icon: FileSearch, title: "Requirement by requirement", body: "Each thing the job asks for is checked against your resume, with the line we matched it to." },
  { icon: Bot, title: "ATS formatting check", body: "Headings, contact details, tables, columns and date formats, all checked for anything a parser might misread." },
  { icon: PenLine, title: "Feedback on every bullet", body: "See which bullets are strong and which ones need a clearer verb, more detail or a result." },
  { icon: ShieldCheck, title: "Your experience, not ours", body: "Suggestions only rework what you've already written. If a rewrite adds a number or tool you never mentioned, we throw it out." },
  { icon: ClipboardCheck, title: "Save your report", body: "Print or save the full breakdown as a PDF to keep next to your application." },
];

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
        <div aria-hidden className="absolute left-1/2 top-[-12rem] -z-10 h-[32rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--primary)_22%,transparent),transparent)]" />

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <FadeIn className="mx-auto max-w-3xl text-center">
            <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface/70 px-3.5 py-1.5 text-xs text-muted">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden />
              Resume and job description analysis
            </p>
            <h1 className="text-gradient text-5xl font-semibold tracking-tight sm:text-7xl">Know Before You Apply.</h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted sm:text-lg">
              Analyze your resume against any job description and discover exactly what an ATS and recruiter may be looking for.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/analyze">
                  Analyze My Resume <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </div>
          </FadeIn>

          <div className="mt-16 sm:mt-20">
            <ProductPreview />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 border-t border-border bg-surface/40 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-strong">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">From upload to ready-to-send</h2>
            <p className="mt-4 text-muted">Six steps, and most people are done in a few minutes.</p>
          </FadeIn>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((step, i) => (
              <FadeIn key={step.title} delay={i * 0.06}>
                <li className="group relative h-full rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-border-strong">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary-strong">
                      <step.icon className="size-5" aria-hidden />
                    </span>
                    <span className="font-mono text-xs text-subtle">0{i + 1}</span>
                  </div>
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                </li>
              </FadeIn>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <FadeIn>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">What you get</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Honest feedback you can act on</h2>
              <p className="mt-5 text-muted">
                We only help you say what you&apos;ve actually done more clearly. If the job wants a skill your resume doesn&apos;t show, we&apos;ll tell you, and we&apos;ll remind you to add it only if you really have it.
              </p>
            </FadeIn>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-surface p-6">
                  <f.icon className="mb-4 size-5 text-primary-strong" aria-hidden />
                  <h3 className="text-sm font-medium">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface/40 py-20 sm:py-24">
        <FadeIn className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">See how your resume stacks up</h2>
          <p className="mt-4 text-muted">It takes about a minute, and you don&apos;t need an account.</p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/analyze">
              Analyze My Resume <ArrowRight aria-hidden />
            </Link>
          </Button>
        </FadeIn>
      </section>
    </>
  );
}
