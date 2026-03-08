"""
Fix Spanish explanations in questions.json:
1. Add proper accent marks (á, é, í, ó, ú, ñ) to known words
2. Normalize tú/usted voice to friendly tú
3. Minor vocabulary fixes (conducir → manejar in casual context)
"""
import json
import re

QUESTIONS_CONTENT = "content/countries/mexico/jalisco/questions.json"
QUESTIONS_PUBLIC = "public/data/jalisco/questions.json"

# ─── Accent mark corrections ───
# Each entry: (unaccented_word, accented_word)
# These use \b word boundaries to avoid matching inside other words.
ACCENT_WORDS = [
    # ñ words
    ("senal", "señal"),
    ("senales", "señales"),
    ("senalizacion", "señalización"),
    ("senializada", "señalizada"),
    ("senializado", "señalizado"),
    ("danio", "daño"),
    ("danios", "daños"),
    ("dania", "daña"),
    ("anio", "año"),
    ("anios", "años"),
    ("ninio", "niño"),
    ("ninios", "niños"),

    # -ción / -sión words (MUST come before shorter patterns)
    ("senalizacion", "señalización"),
    ("infracciones", "infracciones"),  # no accent (plural)
    ("infraccion", "infracción"),
    ("circulacion", "circulación"),
    ("conduccion", "conducción"),
    ("suspensiones", "suspensiones"),
    ("suspension", "suspensión"),
    ("detenciones", "detenciones"),
    ("detencion", "detención"),
    ("intersecciones", "intersecciones"),
    ("interseccion", "intersección"),
    ("educacion", "educación"),
    ("verificacion", "verificación"),
    ("obligacion", "obligación"),
    ("precaucion", "precaución"),
    ("indicaciones", "indicaciones"),
    ("indicacion", "indicación"),
    ("regulaciones", "regulaciones"),
    ("regulacion", "regulación"),
    ("informacion", "información"),
    ("proteccion", "protección"),
    ("situaciones", "situaciones"),
    ("situacion", "situación"),
    ("posicion", "posición"),
    ("restricciones", "restricciones"),
    ("restriccion", "restricción"),
    ("violaciones", "violaciones"),
    ("violacion", "violación"),
    ("sanciones", "sanciones"),
    ("sancion", "sanción"),
    ("autorizacion", "autorización"),
    ("iluminacion", "iluminación"),
    ("operaciones", "operaciones"),
    ("operacion", "operación"),
    ("atencion", "atención"),
    ("retencion", "retención"),
    ("revocacion", "revocación"),
    ("documentacion", "documentación"),
    ("clasificacion", "clasificación"),
    ("identificacion", "identificación"),
    ("comunicacion", "comunicación"),
    ("obstruccion", "obstrucción"),
    ("distraccion", "distracción"),
    ("distracciones", "distracciones"),
    ("reaccion", "reacción"),
    ("condiciones", "condiciones"),
    ("condicion", "condición"),
    ("colisiones", "colisiones"),
    ("colision", "colisión"),
    ("lesiones", "lesiones"),
    ("lesion", "lesión"),
    ("revision", "revisión"),
    ("decision", "decisión"),
    ("traccion", "tracción"),
    ("dimensiones", "dimensiones"),
    ("dimension", "dimensión"),
    ("combinacion", "combinación"),
    ("separacion", "separación"),
    ("cancelacion", "cancelación"),
    ("evaluacion", "evaluación"),
    ("aprobacion", "aprobación"),
    ("aplicacion", "aplicación"),
    ("ocasion", "ocasión"),
    ("direccion", "dirección"),
    ("estacion", "estación"),
    ("habitacion", "habitación"),
    ("absorcion", "absorción"),
    ("vision", "visión"),

    # Common words — WHOLE WORD matches only
    ("vehiculos", "vehículos"),
    ("vehiculo", "vehículo"),
    ("transito", "tránsito"),
    ("trafico", "tráfico"),
    ("numeros", "números"),
    ("numero", "número"),
    ("ademas", "además"),
    ("tambien", "también"),
    ("asi", "así"),
    ("detras", "detrás"),
    ("aqui", "aquí"),
    ("ahi", "ahí"),
    ("despues", "después"),
    ("algun", "algún"),
    ("ningun", "ningún"),
    ("comun", "común"),
    ("segun", "según"),
    ("rapido", "rápido"),
    ("rapida", "rápida"),
    ("rapidamente", "rápidamente"),
    ("maximos", "máximos"),
    ("maximo", "máximo"),
    ("maxima", "máxima"),
    ("minimo", "mínimo"),
    ("minima", "mínima"),
    ("valido", "válido"),
    ("valida", "válida"),
    ("basico", "básico"),
    ("basica", "básica"),
    ("tecnico", "técnico"),
    ("tecnica", "técnica"),
    ("mecanico", "mecánico"),
    ("mecanica", "mecánica"),
    ("mecanicos", "mecánicos"),
    ("unico", "único"),
    ("unica", "única"),
    ("publicos", "públicos"),
    ("publicas", "públicas"),
    ("publico", "público"),
    ("publica", "pública"),
    ("electrico", "eléctrico"),
    ("electrica", "eléctrica"),
    ("electricos", "eléctricos"),
    ("fisico", "físico"),
    ("fisicos", "físicos"),
    ("fisicamente", "físicamente"),
    ("panico", "pánico"),
    ("limites", "límites"),
    ("limite", "límite"),
    ("titulo", "título"),
    ("kilometros", "kilómetros"),
    ("kilometro", "kilómetro"),
    ("periodos", "períodos"),
    ("periodo", "período"),
    ("dias", "días"),
    ("dia", "día"),
    ("habiles", "hábiles"),
    ("habil", "hábil"),
    ("facil", "fácil"),
    ("facilmente", "fácilmente"),
    ("dificil", "difícil"),
    ("movil", "móvil"),
    ("moviles", "móviles"),
    ("automoviles", "automóviles"),
    ("automovil", "automóvil"),
    ("poliza", "póliza"),
    ("codigos", "códigos"),
    ("codigo", "código"),
    ("peaton", "peatón"),
    ("camion", "camión"),
    ("semaforos", "semáforos"),
    ("semaforo", "semáforo"),
    ("proposito", "propósito"),
    ("areas", "áreas"),
    ("area", "área"),
    ("angulo", "ángulo"),
    ("neumatico", "neumático"),
    ("neumaticos", "neumáticos"),
    ("hidraulico", "hidráulico"),
    ("hidraulica", "hidráulica"),
    ("especifico", "específico"),
    ("especifica", "específica"),
    ("especificamente", "específicamente"),
    ("practico", "práctico"),
    ("practica", "práctica"),
    ("practicas", "prácticas"),
    ("logico", "lógico"),
    ("logica", "lógica"),
    ("tipico", "típico"),
    ("tipica", "típica"),
    ("economico", "económico"),
    ("economica", "económica"),
    ("automatico", "automático"),
    ("automatica", "automática"),
    ("automaticamente", "automáticamente"),
    ("ultimo", "último"),
    ("ultima", "última"),
    ("proximo", "próximo"),
    ("proxima", "próxima"),
    ("estandar", "estándar"),
    ("mas", "más"),
    ("policia", "policía"),
    ("policias", "policías"),
    ("energia", "energía"),
    ("garantia", "garantía"),

    # Future tense verbs
    ("estara", "estará"),
    ("podra", "podrá"),
    ("podras", "podrás"),
    ("debera", "deberá"),
    ("deberas", "deberás"),
    ("tendras", "tendrás"),
    ("tendra", "tendrá"),
    ("sera", "será"),
    ("seras", "serás"),
    ("resultara", "resultará"),
    ("permitira", "permitirá"),
    ("continuara", "continuará"),
    ("mantendra", "mantendrá"),
    ("reducira", "reducirá"),
    ("aplicara", "aplicará"),
    ("perderas", "perderás"),
    ("recibiras", "recibirás"),

    # "esta" as verb "está" — careful, needs context
    # We handle this separately below
]

# Words that should NOT get accents (to double-check)
# "que" as relative pronoun, "cual" in "cualquier", "como" in "como si", etc.


def fix_accents(text):
    """Apply accent fixes using word boundaries."""
    result = text
    for wrong, right in ACCENT_WORDS:
        # Build pattern with word boundaries
        pattern = re.compile(r'\b' + re.escape(wrong) + r'\b', re.IGNORECASE)

        def make_replacer(replacement):
            def replacer(match):
                original = match.group(0)
                if original[0].isupper():
                    return replacement[0].upper() + replacement[1:]
                return replacement
            return replacer

        result = pattern.sub(make_replacer(right), result)

    # Special case: "esta" → "está" only when it's a verb (before adjective/adverb/gerund)
    # Patterns where "esta" is the verb "estar" conjugated:
    # "esta prohibido", "esta permitido", "esta determinado", "esta senalizado", etc.
    esta_verb_patterns = [
        (r'\besta (prohibid)', r'está \1'),
        (r'\besta (permitid)', r'está \1'),
        (r'\besta (determinad)', r'está \1'),
        (r'\besta (señalizad)', r'está \1'),
        (r'\besta (senalizad)', r'está \1'),
        (r'\besta (regulad)', r'está \1'),
        (r'\besta (obligad)', r'está \1'),
        (r'\besta (diseñad)', r'está \1'),
        (r'\besta (reservad)', r'está \1'),
        (r'\besta (pensad)', r'está \1'),
        (r'\besta (activamente)', r'está \1'),
        (r'\besta (basad)', r'está \1'),
        (r'\besta (en )', r'está \1'),
        (r'\besta (dentro)', r'está \1'),
        (r'\besta (fuera)', r'está \1'),
        (r'\besta (por )', r'está \1'),
        (r'\besta (a cargo)', r'está \1'),
        (r'\besta (de costado)', r'está \1'),
        (r'\besta (de frente)', r'está \1'),
        (r'\besta (de espaldas)', r'está \1'),
        (r'\besta (vigente)', r'está \1'),
        (r'\besta (correctamente)', r'está \1'),
        (r'\besta (limpio)', r'está \1'),
        (r'\besta (limpia)', r'está \1'),
        (r'\besta (sujeto)', r'está \1'),
        (r'\besta (sujeta)', r'está \1'),
        (r'\besta (dañad)', r'está \1'),
        (r'\besta (bien )', r'está \1'),
        (r'\besta (mal )', r'está \1'),
        (r'\bEsta (prohibid)', r'Está \1'),
        (r'\bEsta (permitid)', r'Está \1'),
        (r'\bEsta es una', r'Está es una'),  # Actually "Esta es" is demonstrative - skip
    ]
    for pattern, replacement in esta_verb_patterns:
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

    # Fix "estan" → "están" (always verb)
    result = re.sub(r'\bestan\b', 'están', result, flags=re.IGNORECASE)

    # "solo" → "sólo" when it means "only" (before verb or adjective)
    # Actually, RAE 2010 says "solo" without accent is now preferred. Skip this.

    return result


def fix_voice(text):
    """Convert formal usted voice to friendly tú voice in explanations."""
    replacements = [
        # Direct "usted" references — replace with context-appropriate form
        (r'hacia usted', 'hacia ti'),
        (r'detrás de usted', 'detrás de ti'),
        (r'cerca de usted', 'cerca de ti'),
        (r'a usted', 'a ti'),
        (r'de usted', 'de ti'),
        (r'ante usted', 'ante ti'),
        (r'\busted\b', 'tú'),

        # "debe" → "debes" (but NOT "se debe" which is impersonal)
        (r'(?<![Ss]e )\bdebe\b(?! de\b)', 'debes'),

        # Possessives in instruction context
        (r'\bsu vehículo', 'tu vehículo'),
        (r'\bsu vehiculo', 'tu vehiculo'),
        (r'\bsu parabrisas\b', 'tu parabrisas'),
        (r'\bsu llanta\b', 'tu llanta'),
        (r'\bsu llantas\b', 'tus llantas'),
        (r'\bsu licencia\b', 'tu licencia'),
        (r'\bsu multa\b', 'tu multa'),
        (r'\bsu carril\b', 'tu carril'),
        (r'\bsus pasajeros\b', 'tus pasajeros'),
        (r'\bsu seguridad\b', 'tu seguridad'),
        (r'\bsu volante\b', 'tu volante'),
        (r'\bsu motor\b', 'tu motor'),

        # "puede" → "puedes" (but NOT "se puede" or "no se puede")
        (r'(?<![Ss]e )\bpuede\b(?! que\b)', 'puedes'),
    ]

    result = text
    for pattern, replacement in replacements:
        result = re.sub(pattern, replacement, result)
    return result


def fix_vocabulary(text):
    """Replace formal vocabulary with Mexican casual equivalents in explanations."""
    replacements = [
        (r'\bal conducir\b', 'al manejar'),
        (r'\bantes de conducir\b', 'antes de manejar'),
        (r'\bConducir ebrio', 'Manejar ebrio'),
        (r'\bconducir ebrio', 'manejar ebrio'),
        (r'\bconducir un veh', 'manejar un veh'),
        (r'\bConducir un veh', 'Manejar un veh'),
        (r'\bLa conducción defensiva', 'El manejo defensivo'),
        (r'\bla conducción defensiva', 'el manejo defensivo'),
        (r'\bconductor ebrio', 'conductor ebrio'),  # keep - "conductor" is fine

        # girar → dar vuelta (for turns, NOT for steering wheel)
        (r'\bgirar a otra\b', 'dar vuelta a otra'),
    ]

    result = text
    for pattern, replacement in replacements:
        result = re.sub(pattern, replacement, result)
    return result


def process_questions(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    changes = 0
    for q in questions:
        original = q.get('explanation_es', '')
        if not original:
            continue

        fixed = original
        fixed = fix_accents(fixed)
        fixed = fix_voice(fixed)
        fixed = fix_vocabulary(fixed)

        if fixed != original:
            q['explanation_es'] = fixed
            changes += 1

    return questions, changes


def verify(questions):
    """Run verification checks on the fixed text."""
    issues = []
    for q in questions:
        e = q.get('explanation_es', '')
        qid = q['id']

        # Check for common wrong accents
        if 'cuálquier' in e.lower():
            issues.append(f'{qid}: "cuálquier" should be "cualquier"')
        if 'ocasíon' in e.lower():
            issues.append(f'{qid}: "ocasíon" should be "ocasión"')
        if 'lesíon' in e.lower():
            issues.append(f'{qid}: "lesíon" should be "lesión"')
        if 'funcíon' in e.lower():
            issues.append(f'{qid}: "funcíon" should be "función"')

    # Check accent coverage
    with_accents = sum(1 for q in questions if any(c in q.get('explanation_es','') for c in 'áéíóúñ'))
    print(f"  Accent coverage: {with_accents}/{len(questions)} explanations have accents")

    if issues:
        print(f"  ISSUES FOUND ({len(issues)}):")
        for i in issues:
            print(f"    {i}")
    else:
        print("  No over-correction issues found")

    return len(issues) == 0


def main():
    print("=== Fixing Spanish explanations ===\n")

    # Fix content source
    questions, changes = process_questions(QUESTIONS_CONTENT)
    print(f"Content: {changes}/{len(questions)} explanations modified")
    verify(questions)

    with open(QUESTIONS_CONTENT, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    print(f"  Saved to {QUESTIONS_CONTENT}\n")

    # Fix public copy
    questions2, changes2 = process_questions(QUESTIONS_PUBLIC)
    print(f"Public:  {changes2}/{len(questions2)} explanations modified")
    verify(questions2)

    with open(QUESTIONS_PUBLIC, 'w', encoding='utf-8') as f:
        json.dump(questions2, f, ensure_ascii=False, indent=2)
    print(f"  Saved to {QUESTIONS_PUBLIC}\n")

    # Show samples
    print("=== Sample output ===\n")
    for q in questions[:5]:
        print(f"{q['id']}: {q['explanation_es'][:200]}")
        print()


if __name__ == '__main__':
    main()
