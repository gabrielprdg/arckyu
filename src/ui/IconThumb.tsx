import type { IconDefinition } from "../icons/catalog";
import { categoryStyle } from "../icons/categoryStyle";
import { getIconComponent } from "../icons/iconComponents";
import { iconifySvgUrl } from "../icons/iconSource";

type IconThumbProps = { icon: Pick<IconDefinition, "ref" | "category" | "source">; size?: number };

/** Miniatura do ícone na paleta e na modal: logo real quando há, senão o glifo no azulejo da categoria. */
export const IconThumb = ({ icon, size = 28 }: IconThumbProps) => {
  const { source } = icon;
  if (source.kind !== "lucide") {
    const src = source.kind === "upload" ? source.dataUrl : iconifySvgUrl(source.id, { height: 64, color: categoryStyle(icon.category).tile });
    return <img className="thumb thumb--image" src={src} width={size} height={size} alt="" loading="lazy" />;
  }
  const Glyph = getIconComponent(icon.ref, icon.category);
  return (
    <span className="thumb" style={{ width: size, height: size, background: categoryStyle(icon.category).tile }}>
      <Glyph size={Math.round(size * 0.64)} color="#fff" />
    </span>
  );
};
