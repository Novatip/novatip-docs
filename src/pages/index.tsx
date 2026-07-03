import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import styles from "./index.module.css";

function HeroBanner() {
  return (
    <div className={styles.heroBanner}>
      <div className="container">
        <img src="img/logo.svg" alt="Novatip logo" className={styles.heroLogo} />
        <Heading as="h1" className={styles.heroTitle}>
          Novatip Documentation
        </Heading>
        <p className={styles.heroSubtitle}>
          Open infrastructure for cross-border micro-tipping on Stellar.
          Tap to tip any creator in 2 seconds, from anywhere in the world.
        </p>
        <div className={styles.heroCtas}>
          <Link className="button button--primary button--lg" to="/architecture">
            Read the Docs
          </Link>
          <Link className="button button--secondary button--lg" to="/sdk/quickstart">
            SDK Quickstart
          </Link>
          <Link
            className="button button--outline button--lg"
            href="https://github.com/novatip"
          >
            GitHub
          </Link>
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    emoji: "⚡",
    title: "Atomic on-chain splits",
    description:
      "The tip_splitter contract routes a single USDC payment across up to 20 " +
      "collaborators atomically. Either everyone gets paid or the whole tip reverts. " +
      "No escrow, no trusted intermediary.",
  },
  {
    emoji: "🔧",
    title: "TypeScript SDK",
    description:
      "Full typed bindings for every contract function, a transaction builder, " +
      "event parser, and wallet adapters. No raw XDR in your application code. " +
      "Works in both Node.js and the browser.",
  },
  {
    emoji: "📊",
    title: "Real-time analytics",
    description:
      "The backend indexes TipReceived events from Soroban RPC and serves " +
      "totals, time-series, and supporter leaderboards. Creator dashboards " +
      "update live within seconds of each tip.",
  },
  {
    emoji: "📱",
    title: "QR code tipping",
    description:
      "Every creator gets a unique tip page at /@slug and a downloadable QR " +
      "code. Print it, share it, embed it. Anyone with a Stellar wallet can " +
      "tip in under 10 seconds.",
  },
  {
    emoji: "🌍",
    title: "Cross-border by default",
    description:
      "Built on Stellar USDC which settles in 3-5 seconds with near-zero fees. " +
      "No payout minimums. No country restrictions. Novatip works the same " +
      "whether you are in Lagos, London, or Los Angeles.",
  },
  {
    emoji: "🔓",
    title: "Open source",
    description:
      "Every repository is open source under the MIT licence. The contract, " +
      "SDK, backend, and frontend are all auditable, forkable, and " +
      "open for contributions.",
  },
];

function FeatureCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className={clsx("col col--4", styles.featureCard)}>
      <div className={styles.featureEmoji} role="img" aria-hidden="true">
        {emoji}
      </div>
      <Heading as="h3">{title}</Heading>
      <p>{description}</p>
    </div>
  );
}

function FeaturesSection() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RepoGrid() {
  const repos = [
    { name: "novatip-contracts", lang: "Rust / Soroban", desc: "On-chain tip splitting contract" },
    { name: "novatip-sdk",       lang: "TypeScript",      desc: "Contract bindings and shared types" },
    { name: "novatip-backend",   lang: "TypeScript",      desc: "Creator profiles, indexer, analytics" },
    { name: "novatip-web",       lang: "Next.js",         desc: "Public tip pages and dashboard" },
  ];

  return (
    <section className={styles.repoGrid}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          Repositories
        </Heading>
        <div className="row">
          {repos.map((r) => (
            <div key={r.name} className={clsx("col col--3", styles.repoCard)}>
              <a
                href={`https://github.com/novatip/${r.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.repoLink}
              >
                <div className={styles.repoName}>{r.name}</div>
                <div className={styles.repoLang}>{r.lang}</div>
                <div className={styles.repoDesc}>{r.desc}</div>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Open infrastructure for cross-border micro-tipping on Stellar."
    >
      <main>
        <HeroBanner />
        <FeaturesSection />
        <RepoGrid />
      </main>
    </Layout>
  );
}
