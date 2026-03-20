#!/usr/bin/env bash
set -euo pipefail

REPO="/home/ricardo/.openclaw/workspace/empire-essence-web"
cd "$REPO"

DATE="20 de marzo, 2026"
LASTMOD="2026-03-20"

cp blog/drafts/senales-de-que-ya-estas-listo-para-vender-perfumes-como-mayorista.html blog/senales-de-que-ya-estas-listo-para-vender-perfumes-como-mayorista.html
cp blog/drafts/por-que-trabajar-con-un-proveedor-confiable-cambia-tu-margen-y-tu-tranquilidad.html blog/por-que-trabajar-con-un-proveedor-confiable-cambia-tu-margen-y-tu-tranquilidad.html

python3 <<'PY'
from pathlib import Path
blog = Path('/home/ricardo/.openclaw/workspace/empire-essence-web/blog/index.html')
text = blog.read_text(encoding='utf-8')
marker = '    <a href="como-iniciar-negocio-perfumes.html" class="article-card">'
insert = '''    <a href="senales-de-que-ya-estas-listo-para-vender-perfumes-como-mayorista.html" class="article-card">
        <div class="date">20 de marzo, 2026</div>
        <h2>Señales de que ya estás listo para vender perfumes como mayorista</h2>
        <p>Una guía clara para saber cuándo ya tienes base comercial suficiente para escalar, reponer mejor y comprar con visión mayorista.</p>
        <span class="read-more">Leer artículo →</span>
    </a>

    <a href="por-que-trabajar-con-un-proveedor-confiable-cambia-tu-margen-y-tu-tranquilidad.html" class="article-card">
        <div class="date">20 de marzo, 2026</div>
        <h2>Por qué trabajar con un proveedor confiable cambia tu margen y tu tranquilidad</h2>
        <p>Descubre cómo un proveedor ordenado y confiable protege tu utilidad, tu tiempo y la experiencia de tus clientes.</p>
        <span class="read-more">Leer artículo →</span>
    </a>

'''
if 'senales-de-que-ya-estas-listo-para-vender-perfumes-como-mayorista.html' not in text:
    text = text.replace(marker, insert + marker)
blog.write_text(text, encoding='utf-8')

sitemap = Path('/home/ricardo/.openclaw/workspace/empire-essence-web/sitemap.xml')
xml = sitemap.read_text(encoding='utf-8')
blog_block = '''  <url>
    <loc>https://empireessence.co/blog/</loc>
    <lastmod>2026-03-19</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
'''
blog_block_new = '''  <url>
    <loc>https://empireessence.co/blog/</loc>
    <lastmod>2026-03-20</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
'''
xml = xml.replace(blog_block, blog_block_new)
entries = '''  <url>
    <loc>https://empireessence.co/blog/senales-de-que-ya-estas-listo-para-vender-perfumes-como-mayorista.html</loc>
    <lastmod>2026-03-20</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://empireessence.co/blog/por-que-trabajar-con-un-proveedor-confiable-cambia-tu-margen-y-tu-tranquilidad.html</loc>
    <lastmod>2026-03-20</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
'''
if 'por-que-trabajar-con-un-proveedor-confiable-cambia-tu-margen-y-tu-tranquilidad.html' not in xml:
    xml = xml.replace('</urlset>', entries + '</urlset>')
sitemap.write_text(xml, encoding='utf-8')
PY

git add \
  blog/index.html \
  sitemap.xml \
  blog/senales-de-que-ya-estas-listo-para-vender-perfumes-como-mayorista.html \
  blog/por-que-trabajar-con-un-proveedor-confiable-cambia-tu-margen-y-tu-tranquilidad.html \
  blog/drafts/senales-de-que-ya-estas-listo-para-vender-perfumes-como-mayorista.html \
  blog/drafts/por-que-trabajar-con-un-proveedor-confiable-cambia-tu-margen-y-tu-tranquilidad.html

git commit -m "content: Publicar 2 artículos evergreen restantes" || true
git push origin main

echo "Publicado part 2 del blog evergreen"
