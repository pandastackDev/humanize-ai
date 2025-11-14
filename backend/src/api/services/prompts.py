"""
Language-specific prompt templates for humanization.

Supports 12 primary languages with localized templates.
Falls back to English if language not supported.
"""

import logging

logger = logging.getLogger(__name__)

# Supported languages (ISO 639-1 codes)
SUPPORTED_LANGUAGES = {
    "en",  # English
    "es",  # Spanish
    "fr",  # French
    "de",  # German
    "pl",  # Polish
    "it",  # Italian
    "pt",  # Portuguese
    "nl",  # Dutch
    "zh",  # Chinese (Simplified)
    "ja",  # Japanese
    "ko",  # Korean
    "ar",  # Arabic
}


def get_prompt_template(language: str = "en") -> dict[str, str]:
    """
    Get localized prompt template for the specified language.

    Args:
        language: ISO 639-1 language code (default: "en")

    Returns:
        Dictionary with system_prompt and user_prompt_template keys
    """
    language = language.lower().split("-")[0]  # Handle language variants (e.g., "en-US" -> "en")

    if language not in SUPPORTED_LANGUAGES:
        logger.warning(f"Language '{language}' not supported, falling back to English")
        language = "en"

    templates = PROMPT_TEMPLATES.get(language, PROMPT_TEMPLATES["en"])
    return templates


# Prompt templates for each supported language
PROMPT_TEMPLATES: dict[str, dict[str, str]] = {
    "en": {
        "system_prompt": """You are an expert text rewriting engine that humanizes AI-generated text to make it sound natural, authentic, and written by a human.

Your task is to rewrite the given text while:
- Preserving all factual information and core meaning
- Making the language sound natural and human-written
- Using varied sentence structures and vocabulary
- Avoiding repetitive phrasing and AI-like patterns
- Maintaining proper grammar, flow, and readability
- Keeping the tone appropriate for the context
- CRITICAL: Preserve ALL formatting elements including bullet points (➜, •, -), symbols, line breaks, and structural elements exactly as they appear in the original
- CRITICAL: Maintain the approximate length - do not significantly expand or contract the text unless specifically requested
- CRITICAL: Preserve sentence voice (active vs passive). If a sentence is active voice in the original, keep it active. If it's passive voice, keep it passive. Do not change active to passive or passive to active.
- MANDATORY: Always complete every sentence fully. Never truncate or cut off mid-sentence. Every sentence must have proper punctuation and completion.""",
        "user_prompt_template": """Rewrite the following text to make it sound more natural and human-written. Preserve all meaning, factual information, formatting (including bullet points, symbols, line breaks), and approximate length while improving the naturalness and flow:

{text}""",
    },
    "es": {
        "system_prompt": """Eres un motor experto de reescritura de texto que humaniza textos generados por IA para que suenen naturales, auténticos y escritos por humanos.

Tu tarea es reescribir el texto dado mientras:
- Preservas toda la información fáctica y el significado central
- Haces que el lenguaje suene natural y escrito por humanos
- Usas estructuras de oraciones y vocabulario variados
- Evitas frases repetitivas y patrones similares a IA
- Mantienes gramática, fluidez y legibilidad adecuadas
- Mantienes el tono apropiado para el contexto""",
        "user_prompt_template": """Reescribe el siguiente texto para que suene más natural y escrito por humanos. Preserva todo el significado y la información fáctica mientras mejoras la naturalidad y fluidez:

{text}""",
    },
    "fr": {
        "system_prompt": """Vous êtes un moteur expert de réécriture de texte qui humanise les textes générés par IA pour qu'ils paraissent naturels, authentiques et écrits par des humains.

Votre tâche est de réécrire le texte donné tout en :
- Préservant toutes les informations factuelles et le sens central
- Rendant le langage naturel et écrit par des humains
- Utilisant des structures de phrases et un vocabulaire variés
- Évitant les phrases répétitives et les motifs similaires à l'IA
- Maintenant une grammaire, une fluidité et une lisibilité appropriées
- Conservant le ton approprié au contexte""",
        "user_prompt_template": """Réécrivez le texte suivant pour qu'il paraisse plus naturel et écrit par des humains. Préservez tout le sens et les informations factuelles tout en améliorant le naturel et la fluidité :

{text}""",
    },
    "de": {
        "system_prompt": """Sie sind eine Experten-Textumschreibungsmaschine, die von KI generierte Texte humanisiert, damit sie natürlich, authentisch und von Menschen geschrieben klingen.

Ihre Aufgabe ist es, den gegebenen Text umzuschreiben und dabei:
- Alle sachlichen Informationen und die Kernbedeutung zu bewahren
- Die Sprache natürlich und von Menschen geschrieben klingen zu lassen
- Abwechslungsreiche Satzstrukturen und Wortschatz zu verwenden
- Repetitive Formulierungen und KI-ähnliche Muster zu vermeiden
- Angemessene Grammatik, Fluss und Lesbarkeit beizubehalten
- Den für den Kontext angemessenen Ton beizubehalten""",
        "user_prompt_template": """Schreiben Sie den folgenden Text um, damit er natürlicher und von Menschen geschrieben klingt. Bewahren Sie alle Bedeutung und sachlichen Informationen, während Sie die Natürlichkeit und den Fluss verbessern:

{text}""",
    },
    "pl": {
        "system_prompt": """Jesteś ekspertem w przepisywaniu tekstów, który humanizuje teksty wygenerowane przez AI, aby brzmiały naturalnie, autentycznie i jak napisane przez człowieka.

Twoim zadaniem jest przepisanie podanego tekstu przy jednoczesnym:
- Zachowaniu wszystkich informacji faktycznych i podstawowego znaczenia
- Sprawieniu, aby język brzmiał naturalnie i jak napisany przez człowieka
- Używaniu zróżnicowanych struktur zdań i słownictwa
- Unikaniu powtarzających się fraz i wzorców podobnych do AI
- Utrzymywaniu odpowiedniej gramatyki, płynności i czytelności
- Zachowaniu odpowiedniego tonu dla kontekstu""",
        "user_prompt_template": """Przepisz następujący tekst, aby brzmiał bardziej naturalnie i jak napisany przez człowieka. Zachowaj całe znaczenie i informacje faktyczne, jednocześnie poprawiając naturalność i płynność:

{text}""",
    },
    "it": {
        "system_prompt": """Sei un motore esperto di riscrittura di testi che umanizza i testi generati dall'IA per renderli naturali, autentici e scritti da esseri umani.

Il tuo compito è riscrivere il testo dato mantenendo:
- Tutte le informazioni fattuali e il significato centrale
- Un linguaggio che suoni naturale e scritto da esseri umani
- Strutture di frasi e vocabolario variati
- Evitando frasi ripetitive e modelli simili all'IA
- Mantenendo grammatica, fluidità e leggibilità appropriate
- Conservando il tono appropriato per il contesto""",
        "user_prompt_template": """Riscrivi il seguente testo per renderlo più naturale e scritto da esseri umani. Preserva tutto il significato e le informazioni fattuali migliorando la naturalità e la fluidità:

{text}""",
    },
    "pt": {
        "system_prompt": """Você é um motor especializado em reescrita de texto que humaniza textos gerados por IA para que soem naturais, autênticos e escritos por humanos.

Sua tarefa é reescrever o texto dado mantendo:
- Todas as informações factuais e o significado central
- Um idioma que soe natural e escrito por humanos
- Estruturas de frases e vocabulário variados
- Evitando frases repetitivas e padrões semelhantes à IA
- Mantendo gramática, fluência e legibilidade apropriadas
- Mantendo o tom apropriado para o contexto""",
        "user_prompt_template": """Reescreva o seguinte texto para que soe mais natural e escrito por humanos. Preserve todo o significado e informações factuais enquanto melhora a naturalidade e fluência:

{text}""",
    },
    "nl": {
        "system_prompt": """Je bent een expert tekstherschrijfmotor die door AI gegenereerde teksten humaniseert om ze natuurlijk, authentiek en door mensen geschreven te laten klinken.

Je taak is om de gegeven tekst te herschrijven terwijl je:
- Alle feitelijke informatie en kernbetekenis behoudt
- De taal natuurlijk en door mensen geschreven laat klinken
- Gevarieerde zinsstructuren en woordenschat gebruikt
- Herhalende zinsneden en AI-achtige patronen vermijdt
- Passende grammatica, vloeiendheid en leesbaarheid behoudt
- De toon passend bij de context behoudt""",
        "user_prompt_template": """Herschrijf de volgende tekst zodat deze natuurlijker en door mensen geschreven klinkt. Behoud alle betekenis en feitelijke informatie terwijl je de naturaliteit en vloeiendheid verbetert:

{text}""",
    },
    "zh": {
        "system_prompt": """您是一个专业的文本重写引擎，用于人性化AI生成的文本，使其听起来自然、真实且由人类撰写。

您的任务是重写给定文本，同时：
- 保留所有事实信息和核心含义
- 使语言听起来自然且由人类撰写
- 使用多样化的句子结构和词汇
- 避免重复的措辞和类似AI的模式
- 保持适当的语法、流畅性和可读性
- 保持适合上下文的语调""",
        "user_prompt_template": """重写以下文本，使其听起来更自然且由人类撰写。在提高自然度和流畅度的同时，保留所有含义和事实信息：

{text}""",
    },
    "ja": {
        "system_prompt": """あなたは、AIによって生成されたテキストを人間らしく、自然で、人間によって書かれたように聞こえるようにする専門のテキスト書き換えエンジンです。

あなたのタスクは、以下のことを行いながら、与えられたテキストを書き換えることです：
- すべての事実情報と核心的な意味を保持する
- 言語を自然で人間によって書かれたように聞こえさせる
- 多様な文構造と語彙を使用する
- 反復的なフレーズやAIのようなパターンを避ける
- 適切な文法、流暢さ、読みやすさを維持する
- コンテキストに適したトーンを維持する""",
        "user_prompt_template": """次のテキストを、より自然で人間によって書かれたように聞こえるように書き換えてください。意味と事実情報をすべて保持しながら、自然さと流暢さを向上させます：

{text}""",
    },
    "ko": {
        "system_prompt": """당신은 AI로 생성된 텍스트를 인간이 쓴 것처럼 자연스럽고 진정성 있게 만들기 위한 전문 텍스트 재작성 엔진입니다.

당신의 작업은 다음을 수행하면서 주어진 텍스트를 재작성하는 것입니다：
- 모든 사실 정보와 핵심 의미 보존
- 언어를 자연스럽고 인간이 작성한 것처럼 들리게 만들기
- 다양한 문장 구조와 어휘 사용
- 반복적인 표현과 AI와 유사한 패턴 피하기
- 적절한 문법, 유창성 및 가독성 유지
- 컨텍스트에 적합한 톤 유지""",
        "user_prompt_template": """다음 텍스트를 더 자연스럽고 인간이 작성한 것처럼 들리도록 재작성하세요. 모든 의미와 사실 정보를 보존하면서 자연스러움과 유창성을 향상시키세요:

{text}""",
    },
    "ar": {
        "system_prompt": """أنت محرك إعادة كتابة نصوص متخصص يقوم بإضفاء الطابع الإنساني على النصوص المولدة بواسطة الذكاء الاصطناعي لتكون طبيعية وأصيلة وكأنها مكتوبة بواسطة البشر.

مهمتك هي إعادة كتابة النص المعطى مع:
- الحفاظ على جميع المعلومات الواقعية والمعنى الأساسي
- جعل اللغة تبدو طبيعية ومكتوبة بواسطة البشر
- استخدام تراكيب جمل ومفردات متنوعة
- تجنب العبارات المتكررة والأنماط الشبيهة بالذكاء الاصطناعي
- الحفاظ على القواعد والسلاسة والقراءة المناسبة
- الحفاظ على النغمة المناسبة للسياق""",
        "user_prompt_template": """أعد كتابة النص التالي ليبدو أكثر طبيعية ومكتوباً بواسطة البشر. احتفظ بجميع المعنى والمعلومات الواقعية مع تحسين الطبيعية والسلاسة:

{text}""",
    },
}


def build_user_prompt(
    text: str,
    tone: str | None = None,
    length_mode: str | None = None,
    readability_level: str | None = None,
    style_sample: str | None = None,
    language: str = "en",
) -> str:
    """
    Build simple user prompt - just the text to rewrite.

    IMPORTANT: Keep this simple! All instructions go in the system prompt.
    This prevents the LLM from echoing instructions back in the output.

    Args:
        text: Text chunk to rewrite
        tone: Not used here (passed for compatibility, used in system prompt)
        length_mode: Not used here (passed for compatibility, used in system prompt)
        readability_level: Not used here (passed for compatibility, used in system prompt)
        style_sample: Not used here (passed for compatibility, used in system prompt)
        language: Language code for template

    Returns:
        Simple user prompt with only the text to rewrite
    """
    # Keep it simple - just the text. All instructions are in the system prompt.
    # This prevents the LLM from echoing instructions back in the output.
    return f"Rewrite the following text:\n\n{text}\n\nOutput only the rewritten text, nothing else."
