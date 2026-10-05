import type { KeywordCategory } from "@/lib/schemas";

/**
 * Curated vocabulary used by the deterministic engine (local mode, job preview,
 * and factual-integrity checks). Each entry may define aliases that count as the same skill.
 */
interface Term {
  term: string;
  category: KeywordCategory;
  aliases?: string[];
}

const hard = (term: string, aliases: string[] = []): Term => ({ term, category: "hard_skill", aliases });
const tool = (term: string, aliases: string[] = []): Term => ({ term, category: "tool", aliases });
const domain = (term: string, aliases: string[] = []): Term => ({ term, category: "domain", aliases });
const soft = (term: string, aliases: string[] = []): Term => ({ term, category: "soft_skill", aliases });
const cert = (term: string, aliases: string[] = []): Term => ({ term, category: "certification", aliases });

export const TERMS: Term[] = [
  // Languages
  hard("JavaScript", ["JS", "ES6"]), hard("TypeScript", ["TS"]), hard("Python"), hard("Java"),
  hard("C#", ["C Sharp", ".NET C#"]), hard("C++", ["CPP"]), hard("Go", ["Golang"]), hard("Rust"),
  hard("Ruby"), hard("PHP"), hard("Kotlin"), hard("Swift"), hard("Scala"), hard("R"), hard("SQL"),
  hard("Bash", ["Shell scripting", "shell"]), hard("PowerShell"), hard("HTML", ["HTML5"]), hard("CSS", ["CSS3"]),
  // Frameworks
  tool("React", ["React.js", "ReactJS"]), tool("Next.js", ["NextJS"]), tool("Angular"), tool("Vue", ["Vue.js"]),
  tool("Node.js", ["Node", "NodeJS"]), tool("Express", ["Express.js"]), tool("Django"), tool("Flask"),
  tool("FastAPI"), tool("Spring Boot", ["Spring"]), tool(".NET", ["dotnet", "ASP.NET"]), tool("Rails", ["Ruby on Rails"]),
  tool("Tailwind CSS", ["Tailwind"]), tool("Redux"), tool("GraphQL"), tool("React Native"), tool("Flutter"),
  // Data / ML
  tool("PostgreSQL", ["Postgres"]), tool("MySQL"), tool("MongoDB"), tool("Redis"), tool("Elasticsearch"),
  tool("Snowflake"), tool("BigQuery"), tool("Spark", ["Apache Spark", "PySpark"]), tool("Kafka", ["Apache Kafka"]),
  tool("Airflow", ["Apache Airflow"]), tool("dbt"), tool("Pandas"), tool("NumPy"), tool("TensorFlow"),
  tool("PyTorch"), tool("scikit-learn", ["sklearn"]), tool("Tableau"), tool("Power BI", ["PowerBI"]), tool("Excel"),
  tool("Looker"), hard("Machine Learning", ["ML"]), hard("Deep Learning"), hard("NLP", ["Natural Language Processing"]),
  hard("LLM", ["Large Language Models", "LLMs"]), hard("Data Analysis", ["Data Analytics"]), hard("Data Modeling"),
  hard("ETL", ["ELT", "Data Pipelines"]), hard("Statistics", ["Statistical analysis"]), hard("A/B Testing", ["AB testing", "experimentation"]),
  // Cloud / DevOps
  tool("AWS", ["Amazon Web Services"]), tool("Azure", ["Microsoft Azure"]), tool("GCP", ["Google Cloud"]),
  tool("Docker"), tool("Kubernetes", ["K8s"]), tool("Terraform"), tool("Ansible"), tool("Jenkins"),
  tool("GitHub Actions"), tool("GitLab CI", ["GitLab"]), tool("CircleCI"), tool("Azure DevOps"), tool("Git"),
  tool("Linux"), hard("CI/CD", ["CI CD", "Continuous Integration", "Continuous Delivery", "Continuous Deployment"]),
  hard("Microservices"), hard("REST API", ["REST", "RESTful", "REST APIs"]), hard("API Design"),
  hard("Distributed Systems"), hard("System Design"), hard("Cloud Infrastructure"), hard("Serverless"),
  hard("Observability", ["Monitoring"]), tool("Datadog"), tool("Grafana"), tool("Prometheus"), tool("Splunk"),
  // QA / Testing
  hard("API Testing"), hard("Test Automation", ["Automation testing", "automated testing"]),
  hard("Manual Testing"), hard("Regression Testing"), hard("Performance Testing", ["Load testing"]),
  hard("Unit Testing"), hard("Integration Testing"), hard("End-to-End Testing", ["E2E testing", "E2E"]),
  hard("Test Planning", ["Test plans"]), hard("Test Cases", ["Test case design"]), tool("Selenium"),
  tool("Playwright"), tool("Cypress"), tool("Postman"), tool("JMeter"), tool("Jest"), tool("Pytest"),
  tool("JUnit"), tool("TestNG"), tool("Appium"), tool("Cucumber", ["BDD", "Gherkin"]), tool("JIRA", ["Jira"]),
  tool("TestRail"), tool("Confluence"),
  // Security
  hard("Cybersecurity", ["Information Security", "InfoSec"]), hard("Penetration Testing", ["Pentesting"]),
  hard("Vulnerability Management"), hard("SIEM"), hard("IAM", ["Identity and Access Management"]),
  hard("OWASP"), hard("Network Security"),
  // Product / Business / Design
  domain("Agile", ["Agile methodologies"]), domain("Scrum"), domain("Kanban"), domain("SDLC"),
  domain("Product Management"), domain("Roadmapping", ["Product roadmap", "roadmap"]), domain("Stakeholder Management", ["Stakeholders"]),
  domain("Project Management"), domain("Requirements Gathering"), domain("User Research"), domain("UX Design", ["UX", "User Experience"]),
  domain("UI Design", ["UI"]), tool("Figma"), domain("SaaS"), domain("B2B"), domain("E-commerce", ["Ecommerce"]),
  domain("Fintech"), domain("Healthcare"), domain("Payments"), domain("CRM"), tool("Salesforce"), tool("HubSpot"),
  domain("SEO"), domain("Digital Marketing"), domain("Content Strategy"), domain("Financial Modeling"),
  domain("Budgeting"), domain("Forecasting"), domain("Sales"), domain("Customer Success"), domain("Account Management"),
  domain("Business Analysis"), domain("KPIs", ["KPI", "metrics"]), domain("OKRs", ["OKR"]), domain("Compliance"),
  domain("GDPR"), domain("HIPAA"), domain("SOC 2", ["SOC2"]), domain("Accessibility", ["WCAG", "a11y"]),
  // Soft skills
  soft("Communication", ["communication skills", "communicate"]), soft("Leadership", ["led", "lead"]),
  soft("Collaboration", ["collaborate", "cross-functional", "teamwork"]), soft("Problem Solving", ["problem-solving"]),
  soft("Mentoring", ["mentor", "mentored", "coaching"]), soft("Attention to Detail", ["detail-oriented"]),
  soft("Time Management"), soft("Critical Thinking"), soft("Adaptability"), soft("Ownership"),
  // Certifications
  cert("AWS Certified", ["AWS Certification", "AWS Solutions Architect"]), cert("PMP"), cert("ISTQB"),
  cert("CISSP"), cert("Scrum Master", ["CSM", "PSM"]), cert("CPA"), cert("Security+", ["CompTIA Security+"]),
  cert("CKA", ["Certified Kubernetes Administrator"]),
];

/** Short / ambiguous terms that should only be matched case-sensitively. */
export const CASE_SENSITIVE_TERMS = new Set(["R", "Go", "UI", "UX", "ML", "JS", "TS", "Node", "Spring", "REST", "E2E"]);

/** Soft-skill aliases that are too generic to count as evidence on their own. */
export const WEAK_ALIASES = new Set(["lead", "led", "communicate", "metrics", "roadmap", "monitoring", "shell", "UI"]);

export const ACTION_VERBS = new Set(
  `accelerated achieved administered analyzed architected automated built championed coached collaborated
  configured consolidated coordinated created cut debugged decreased defined delivered deployed designed developed
  devised directed documented drove eliminated enabled engineered established evaluated executed expanded facilitated
  founded generated grew guided identified implemented improved increased influenced initiated integrated introduced
  investigated launched led maintained managed mentored migrated modernized monitored negotiated optimized orchestrated
  organized overhauled owned partnered piloted planned prioritized produced programmed published reduced refactored
  resolved restructured revamped scaled secured shipped simplified spearheaded standardized streamlined strengthened
  supervised supported tested trained transformed troubleshot unified upgraded validated verified wrote authored
  conducted created prepared presented researched reviewed`
    .split(/\s+/)
    .filter(Boolean),
);

export const WEAK_OPENERS = [
  "responsible for",
  "worked on",
  "helped with",
  "helped",
  "assisted with",
  "assisted in",
  "involved in",
  "tasked with",
  "duties included",
  "in charge of",
  "participated in",
];

export const STANDARD_HEADINGS: Record<string, RegExp> = {
  summary: /^(professional\s+)?(summary|profile|objective|about( me)?|career summary|professional profile)$/i,
  experience: /^(professional\s+|work\s+|relevant\s+)?(experience|employment( history)?|work history|career history)$/i,
  education: /^(education|academic background|education and training|academics)$/i,
  skills: /^((technical|core|key)\s+)?(skills|competencies|technologies|tech stack|skills (&|and) tools|expertise)$/i,
  projects: /^((personal|selected|key|academic)\s+)?projects$/i,
  certifications: /^(certifications?|licenses?( (&|and) certifications)?|certificates|courses)$/i,
  awards: /^(awards|honors|achievements|awards (&|and) honors)$/i,
};
