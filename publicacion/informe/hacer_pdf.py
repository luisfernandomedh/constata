"""
Arma el informe de una página en PDF.

No usa navegador: el headless de Brave dejó de generar PDF en esta máquina y
una dependencia que falla en silencio no sirve para un entregable. ReportLab
dibuja el documento directamente, así que el resultado es el mismo siempre.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

SALIDA = "Constata-revision-seguridad.pdf"

# Paleta del proyecto: hueso, azules claros, y el rojo solo para lo que falló.
AZUL     = colors.HexColor("#2f6690")
ALTO     = colors.HexColor("#a8442f")
TINTA    = colors.HexColor("#1d2733")
SUAVE    = colors.HexColor("#4a5763")
GRIS     = colors.HexColor("#6b7886")
BORDE    = colors.HexColor("#d8dfe6")
FILA     = colors.HexColor("#eef1f4")
F_ANTES  = colors.HexColor("#fdf4f1")
F_AHORA  = colors.HexColor("#f3f7fb")
F_PRUEBA = colors.HexColor("#fafbfc")
F_CARTA  = colors.HexColor("#fbfcfd")


def p(nombre, **kw):
    base = dict(fontName="Helvetica", fontSize=7.6, leading=9.4, textColor=TINTA)
    base.update(kw)
    return ParagraphStyle(nombre, **base)


E = {
    "titulo":   p("titulo", fontName="Helvetica-Bold", fontSize=16.5, leading=18.5),
    "fecha":    p("fecha", fontSize=7.4, textColor=GRIS, alignment=2),
    "entrada":  p("entrada", fontSize=8.7, leading=11.2, textColor=colors.HexColor("#33414f")),
    "seccion":  p("seccion", fontName="Helvetica-Bold", fontSize=7.9, textColor=AZUL, leading=9),
    "hallazgo": p("hallazgo", fontName="Helvetica-Bold", fontSize=9.1, leading=10.9),
    "rot_a":    p("rot_a", fontName="Helvetica-Bold", fontSize=6.2, textColor=ALTO, leading=7.6),
    "rot_b":    p("rot_b", fontName="Helvetica-Bold", fontSize=6.2, textColor=AZUL, leading=7.6),
    "rot_c":    p("rot_c", fontName="Helvetica-Bold", fontSize=6.2, textColor=GRIS, leading=7.6),
    "que":      p("que", fontName="Helvetica-Bold", fontSize=8.8, leading=10.6),
    "cuerpo":   p("cuerpo", fontSize=7.5, leading=9.4),
    "cifra":    p("cifra", fontName="Helvetica-Bold", fontSize=19, textColor=AZUL, leading=17),
    "carta":    p("carta", fontSize=7.6, leading=9.4, textColor=SUAVE),
    "lec_t":    p("lec_t", fontName="Helvetica-Bold", fontSize=9.2, leading=11),
    "lec_c":    p("lec_c", fontSize=8.2, leading=10.4),
    "th":       p("th", fontName="Helvetica-Bold", fontSize=6.2, textColor=GRIS, leading=7.6),
    "td":       p("td", fontSize=7.7, leading=9.6),
    "td_d":     p("td_d", fontSize=7.7, leading=9.6, alignment=2),
    "pie":      p("pie", fontSize=6.8, textColor=GRIS, leading=8),
    "pie_d":    p("pie_d", fontSize=6.8, textColor=GRIS, leading=8, alignment=2),
}

ANCHO = A4[0] - 24 * mm          # dos márgenes de 12 mm
TERCIO = ANCHO / 3.0


def cabecera():
    t = Table(
        [[Paragraph("Constata — revisión de seguridad", E["titulo"]),
          Paragraph("17 de septiembre de 2026<br/>constata.dev", E["fecha"])]],
        colWidths=[ANCHO * 0.66, ANCHO * 0.34],
    )
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("LINEBELOW", (0, 0), (-1, -1), 1.4, AZUL),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


def seccion(texto):
    return Paragraph(texto.upper(), E["seccion"])


def hallazgo(n, nombre, antes, ahora, prueba):
    """Una fila de tres columnas: qué fallaba, qué se cambió, cómo lo comprobé."""
    titulo = Paragraph(
        f'<font color="#2f6690" size="11"><b>{n}</b></font>&nbsp;&nbsp;{nombre}',
        E["hallazgo"])

    def celda(rot, estilo_rot, que, cuerpo):
        piezas = [Paragraph(rot, estilo_rot), Spacer(1, 1.6)]
        if que:
            piezas += [Paragraph(que, E["que"]), Spacer(1, 1.2)]
        piezas.append(Paragraph(cuerpo, E["cuerpo"]))
        return piezas

    caja = Table(
        [[celda("QUÉ SE ENCONTRÓ", E["rot_a"], None, antes[1]),
          celda("CÓMO PODÍA AFECTAR", E["rot_b"], None, ahora[1]),
          celda("CORRECCIÓN Y PRUEBA", E["rot_c"], None, prueba)]],
        colWidths=[TERCIO] * 3,
    )
    caja.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (0, 0), F_ANTES),
        ("BACKGROUND", (1, 0), (1, 0), F_AHORA),
        ("BACKGROUND", (2, 0), (2, 0), F_PRUEBA),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDE),
        ("LINEAFTER", (0, 0), (1, 0), 0.5, BORDE),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return [titulo, Spacer(1, 3), caja, Spacer(1, 7)]


def tarjetas(datos):
    fila = []
    for cifra, titulo, texto in datos:
        fila.append([Paragraph(cifra, E["cifra"]), Spacer(1, 2),
                     Paragraph(f"<b>{titulo}</b><br/>{texto}", E["carta"])])
    t = Table([fila], colWidths=[ANCHO / 4.0] * 4)
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), F_CARTA),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDE),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDE),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return t


def leccion(titulo, cuerpo):
    t = Table([[[Paragraph(titulo, E["lec_t"]), Spacer(1, 2),
                 Paragraph(cuerpo, E["lec_c"])]]], colWidths=[ANCHO])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), F_ANTES),
        ("LINEBEFORE", (0, 0), (0, -1), 2.2, ALTO),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def tabla_estado(filas):
    datos = [[Paragraph("QUÉ SE REVISÓ", E["th"]),
              Paragraph("HERRAMIENTA", E["th"]),
              Paragraph("RESULTADO", ParagraphStyle("thd", parent=E["th"], alignment=2))]]
    for a, b, c in filas:
        datos.append([Paragraph(a, E["td"]), Paragraph(b, E["td"]), Paragraph(c, E["td_d"])])
    t = Table(datos, colWidths=[ANCHO * 0.42, ANCHO * 0.22, ANCHO * 0.36])
    estilo = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, 0), 0.6, BORDE),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(datos) - 1):
        estilo.append(("LINEBELOW", (0, i), (-1, i), 0.4, FILA))
    t.setStyle(TableStyle(estilo))
    return t


def tabla(cabeceras, filas, proporciones):
    """Tabla simple con cabecera. `proporciones` suma 1."""
    anchos = [ANCHO * x for x in proporciones]
    fila_cab = []
    for i, c in enumerate(cabeceras):
        estilo = E["th"] if i < len(cabeceras) - 1 else ParagraphStyle(
            "thd", parent=E["th"], alignment=2)
        fila_cab.append(Paragraph(c, estilo))
    datos = [fila_cab]
    for f in filas:
        celdas = []
        for i, v in enumerate(f):
            celdas.append(Paragraph(v, E["td"] if i < len(f) - 1 else E["td_d"]))
        datos.append(celdas)
    t = Table(datos, colWidths=anchos)
    estilo = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, 0), 0.6, BORDE),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (-1, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 3.4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.4),
    ]
    for i in range(1, len(datos) - 1):
        estilo.append(("LINEBELOW", (0, i), (-1, i), 0.4, FILA))
    t.setStyle(TableStyle(estilo))
    return t


def pie():
    t = Table([[Paragraph("Luis Medina · luisfernandomedhe@gmail.com", E["pie"]),
                Paragraph("Todas las pruebas son reproducibles con los comandos del repositorio",
                          E["pie_d"])]],
              colWidths=[ANCHO * 0.42, ANCHO * 0.58])
    t.setStyle(TableStyle([
        ("LINEABOVE", (0, 0), (-1, 0), 0.5, BORDE),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


ok = lambda s: f'<font color="#2f6690"><b>{s}</b></font>'
no = lambda s: f'<font color="#a8442f"><b>{s}</b></font>'

historia = []
historia += [cabecera(), Spacer(1, 7)]
historia += [Paragraph(
    "El presente informe consolida las pruebas de seguridad realizadas sobre Constata "
    "(constata.dev) el <b>17 de septiembre de 2026</b>. Se evaluaron tres frentes con tres "
    "herramientas de uso libre —<b>Trivy</b>, <b>Semgrep</b> y <b>Gitleaks</b>— y se sumó una "
    "cuarta revisión sobre la configuración con la que el sitio atiende al público. "
    "Se detectaron <b>tres fallos</b> en esa configuración y <b>un aviso</b> en una dependencia. "
    "Todos los resultados son reproducibles.",
    E["entrada"]), Spacer(1, 10)]

historia += [seccion("Alcance y resultados"), Spacer(1, 5)]
historia += [tabla(
    ["FRENTE EVALUADO", "HERRAMIENTA", "QUÉ SE REVISÓ", "RESULTADO"],
    [("Sitio publicado", "pruebas en vivo",
      "la configuración con la que el sitio responde a quien lo visita",
      no("3 fallos") + " · hallazgos 1, 2 y 3"),
     ("Composición", "Trivy 0.74",
      "los 95 programas de terceros que el proyecto trae consigo",
      "1 aviso · hallazgo 4"),
     ("Código y lógica", "Semgrep 1.177",
      "1.494 líneas propias, contra 104 reglas automáticas", ok("sin hallazgos")),
     ("Secretos", "Gitleaks 8.30",
      "las 66 versiones guardadas del proyecto, desde la primera", ok("sin hallazgos"))],
    [0.15, 0.15, 0.42, 0.28]), Spacer(1, 10)]

historia += [seccion("Hallazgos"), Spacer(1, 5)]

historia += hallazgo(
    1, "La página aceptaba cualquier programa que llegara a ella",
    ("",
     "La página no declaraba de qué sitios podía cargar programas, así que el navegador "
     "ejecutaba cualquiera que apareciera en ella."),
    ("",
     "Si alguien lograba colar un programa —por ejemplo dentro de un archivo subido—, ese "
     "programa podía leer la captura de pantalla que la persona acababa de compartir y cambiar "
     "el veredicto que veía."),
    "Se declaró la lista de sitios permitidos.<br/>"
    f"Prueba: se intentó cargar un programa desde un sitio ajeno. {ok('Bloqueado.')}")

historia += hallazgo(
    2, "Los dos archivos que vienen de fuera no se verificaban",
    ("",
     "La página pedía dos programas prestados a servidores ajenos y aceptaba lo que esos "
     "servidores le devolvieran, sin comprobar que fuera el archivo esperado."),
    ("",
     "Si uno de esos servidores entregaba un archivo alterado, corría dentro de la página con "
     "los mismos permisos que el código propio, sin que nadie lo notara."),
    "Se guardó la huella del archivo verificado.<br/>"
    f"Prueba: con huella falsa, {no('descartado')}; con la correcta, {ok('se ejecuta')}. "
    "El lector de imágenes sigue funcionando.")

historia += hallazgo(
    3, "Cualquier sitio web podía usar el servidor del proyecto",
    ("",
     "El servidor atendía peticiones de cualquier origen. El tope de consultas por conexión "
     "funcionaba, pero podía rodearse."),
    ("",
     "Otro sitio podía incluir un programa que llamara al servidor desde el navegador de cada "
     "uno de sus visitantes. Mil visitantes son mil conexiones distintas: ninguna llega al tope "
     "y la capacidad diaria se agota para quien la necesita."),
    "El servidor solo autoriza al propio sitio.<br/>"
    f"Prueba: desde un origen inventado, {no('sin permiso')}; desde constata.dev, "
    f"{ok('con permiso')}.")

historia += hallazgo(
    4, "Una biblioteca de desarrollo arrastra una vulnerabilidad conocida",
    ("",
     "La biblioteca <b>sharp 0.35.2</b>, que llega como dependencia de la herramienta de "
     "despliegue, tiene una vulnerabilidad de severidad alta registrada."),
    ("",
     "Solo se usa en el equipo de desarrollo al construir el proyecto. No forma parte de lo que "
     "se publica ni llega al navegador de quien visita el sitio, así que haría falta que alguien "
     "ya tuviera acceso al equipo."),
    "Actualización a 0.35.4, dentro del plazo comprometido.<br/>"
    "Estado: <b>pendiente</b>. Es el único de los cuatro que no se ha aplicado.")

historia += [seccion("Remediación"), Spacer(1, 5)]
historia += [tabla(
    ["HALLAZGO", "SEVERIDAD", "FECHA DE APLICACIÓN", "ESTADO"],
    [("Programas no declarados en la página", "Alta", "17 sep 2026", ok("Remediado")),
     ("Archivos externos sin verificar", "Alta", "17 sep 2026", ok("Remediado")),
     ("Servidor abierto a cualquier origen", "Media", "17 sep 2026", ok("Remediado")),
     ("Dependencia sharp 0.35.2", "Baja en este contexto",
      "hasta el 17 nov 2026", "Pendiente")],
    [0.42, 0.18, 0.22, 0.18]), Spacer(1, 6)]
historia += [Paragraph(
    "Plazo comprometido para el conjunto: <b>17 de noviembre de 2026</b>. Las tres correcciones "
    "de severidad alta y media se aplicaron y verificaron el mismo día de la detección.",
    E["cuerpo"])]

doc = BaseDocTemplate(SALIDA, pagesize=A4,
                      leftMargin=12 * mm, rightMargin=12 * mm,
                      topMargin=11 * mm, bottomMargin=11 * mm,
                      title="Constata — revisión de seguridad",
                      author="Luis Medina")

ALTO_PIE = 13 * mm
marco = Frame(doc.leftMargin, doc.bottomMargin + ALTO_PIE,
              ANCHO, A4[1] - 11 * mm - 11 * mm - ALTO_PIE,
              leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)


def dibujar_pie(lienzo, documento):
    t = pie()
    t.wrapOn(lienzo, ANCHO, ALTO_PIE)
    t.drawOn(lienzo, doc.leftMargin, doc.bottomMargin)


doc.addPageTemplates([PageTemplate(id="uno", frames=[marco], onPage=dibujar_pie)])
doc.build(historia)
print("escrito:", SALIDA)
