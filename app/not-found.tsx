import Link from "next/link";

export default function NotFound() {
  return <main className="not-found-page"><div className="card not-found-card"><span className="eyebrow">UPSC STUDY DESK</span><h1>That page is not here.</h1><p>The page may have moved, or this content is not part of your enabled study library.</p><Link href="/dashboard" className="button button-primary">Return to private desk</Link></div></main>;
}
