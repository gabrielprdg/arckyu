import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "../routing/Link";

/** CTA da marca: pílula + botão redondo com a seta ↗, que gira no hover. */
export const CtaLink = ({ href, children, large = false, tone = "primary" }: { href: string; children: ReactNode; large?: boolean; tone?: "primary" | "outline" }) => (
  <Link href={href} className="ak-cta">
    <span className={`ak-btn${tone === "primary" ? " ak-btn--primary" : ""}${large ? " ak-btn--lg" : ""}`}>{children}</span>
    <span className={`ak-round${tone === "primary" ? " ak-round--ink" : ""}${large ? " ak-round--lg" : ""}`} aria-hidden><ArrowUpRight className="ak-i" /></span>
  </Link>
);

/** Abertura de seção: linha fina, "( rótulo )" à esquerda, índice à direita e o título (com <em> no acento). */
export const SectionHead = ({ label, index, title, id }: { label: string; index: string; title: ReactNode; id: string }) => (
  <>
    <div className="section-head"><span className="ak-label">( {label} )</span><span className="ak-index">{index}</span></div>
    <h2 className="section-title" id={id}>{title}</h2>
  </>
);
