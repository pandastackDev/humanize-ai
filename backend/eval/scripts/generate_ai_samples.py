"""
Generate AI-written test samples for evaluation.

This script generates text samples using various LLMs (OpenAI, Anthropic)
across different tones, languages, and lengths.
"""

import json

# Add parent directory to path
import sys
from datetime import datetime
from pathlib import Path

from anthropic import Anthropic
from openai import OpenAI

sys.path.append(str(Path(__file__).parent.parent))

from config import config

TOPICS_BY_DOMAIN = {
    "history": [
        "The Renaissance period in Europe",
        "The Industrial Revolution's impact",
        "Ancient Egyptian civilization",
        "The Cold War era",
        "Medieval European society",
    ],
    "technology": [
        "The evolution of artificial intelligence",
        "Blockchain technology and its applications",
        "Quantum computing fundamentals",
        "The future of renewable energy",
        "Cybersecurity in the modern age",
    ],
    "science": [
        "The human immune system",
        "Climate change and global warming",
        "The theory of evolution",
        "Genetic engineering and CRISPR",
        "The universe and cosmology",
    ],
    "blog": [
        "10 productivity tips for remote workers",
        "How to start a successful side hustle",
        "The benefits of meditation and mindfulness",
        "Best practices for healthy eating",
        "Travel destinations for budget travelers",
    ],
    "business": [
        "Effective leadership strategies",
        "Marketing in the digital age",
        "Financial planning for startups",
        "Customer retention techniques",
        "Supply chain management best practices",
    ],
}


def generate_with_openai(
    client: OpenAI, topic: str, tone: str, word_count: int, language: str = "English"
) -> str:
    """Generate text using OpenAI."""

    prompt = f"""Write a {word_count}-word {tone.lower()} text about: {topic}

Requirements:
- Write in {language}
- Target length: {word_count} words
- Tone: {tone}
- Make it sound natural and {tone.lower()}
- Do NOT include a title or heading
- Start directly with the content"""

    response = client.chat.completions.create(
        model="gpt-4", messages=[{"role": "user", "content": prompt}], temperature=0.7
    )

    content = response.choices[0].message.content
    if content is None:
        raise ValueError("OpenAI API returned None content")
    return content.strip()


def generate_with_anthropic(
    client: Anthropic, topic: str, tone: str, word_count: int, language: str = "English"
) -> str:
    """Generate text using Anthropic Claude."""

    prompt = f"""Write a {word_count}-word {tone.lower()} text about: {topic}

Requirements:
- Write in {language}
- Target length: {word_count} words
- Tone: {tone}
- Make it sound natural and {tone.lower()}
- Do NOT include a title or heading
- Start directly with the content"""

    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )

    # Handle different content block types
    if not response.content:
        raise ValueError("Anthropic API returned empty content")

    first_block = response.content[0]
    # Check if it's a TextBlock (has text attribute)
    # Use getattr to safely access text attribute
    text = getattr(first_block, "text", None)
    if text:
        return text.strip()
    else:
        raise ValueError(f"Anthropic API returned unexpected content type: {type(first_block)}")


def count_words(text: str) -> int:
    """Count words in text."""
    return len(text.split())


def generate_dataset(
    num_samples_per_tone: int = 3,
    languages: list[str] | None = None,
    tones: list[str] | None = None,
    use_openai: bool = True,
    use_anthropic: bool = True,
):
    """
    Generate a comprehensive AI-written dataset.

    Args:
        num_samples_per_tone: Number of samples to generate per tone/length combination
        languages: List of languages to generate (default: config.TIER1_LANGUAGES)
        tones: List of tones to generate (default: config.SUPPORTED_TONES)
        use_openai: Whether to use OpenAI API
        use_anthropic: Whether to use Anthropic API
    """

    if languages is None:
        languages = ["English"]  # Start with English only

    if tones is None:
        tones = config.SUPPORTED_TONES[:4]  # Start with first 4 tones

    # Initialize clients
    openai_client = None
    anthropic_client = None

    if use_openai and config.OPENAI_API_KEY:
        openai_client = OpenAI(api_key=config.OPENAI_API_KEY)

    if use_anthropic and config.ANTHROPIC_API_KEY:
        anthropic_client = Anthropic(api_key=config.ANTHROPIC_API_KEY)

    if not openai_client and not anthropic_client:
        print("ERROR: No API keys configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY")
        return

    datasets = {"short": [], "long": []}

    # Map tones to domains
    tone_domain_map = {
        "Academic": "history",
        "Professional": "business",
        "Scientific": "science",
        "Technical": "technology",
        "Blog/SEO": "blog",
        "Casual": "blog",
        "Creative": "blog",
        "Standard": "history",
    }

    sample_id = 0

    for language in languages:
        for tone in tones:
            domain = tone_domain_map.get(tone, "history")
            topics = TOPICS_BY_DOMAIN[domain]

            # Generate short samples (80-200 words)
            for i in range(num_samples_per_tone):
                sample_id += 1
                topic = topics[i % len(topics)]
                word_target = 150

                # Alternate between OpenAI and Anthropic
                if openai_client and (not anthropic_client or sample_id % 2 == 0):
                    text = generate_with_openai(openai_client, topic, tone, word_target, language)
                    generator = "gpt4"
                elif anthropic_client:
                    text = generate_with_anthropic(
                        anthropic_client, topic, tone, word_target, language
                    )
                    generator = "claude"
                else:
                    continue

                datasets["short"].append(
                    {
                        "id": f"ai_{language[:2].lower()}_{tone.lower().replace('/', '_')}_{sample_id:03d}_short",
                        "text": text,
                        "metadata": {
                            "language": language[:2].lower(),
                            "tone": tone,
                            "word_count": count_words(text),
                            "source": "ai_generated",
                            "generator": generator,
                            "domain": domain,
                            "topic": topic,
                            "date_added": datetime.now().strftime("%Y-%m-%d"),
                            "target_word_count": word_target,
                        },
                    }
                )

                print(
                    f"✓ Generated short {tone} sample in {language} using {generator} ({count_words(text)} words)"
                )

            # Generate long samples (400-800 words)
            for i in range(num_samples_per_tone):
                sample_id += 1
                topic = topics[i % len(topics)]
                word_target = 500

                # Alternate between OpenAI and Anthropic
                if openai_client and (not anthropic_client or sample_id % 2 == 0):
                    text = generate_with_openai(openai_client, topic, tone, word_target, language)
                    generator = "gpt4"
                elif anthropic_client:
                    text = generate_with_anthropic(
                        anthropic_client, topic, tone, word_target, language
                    )
                    generator = "claude"
                else:
                    continue

                datasets["long"].append(
                    {
                        "id": f"ai_{language[:2].lower()}_{tone.lower().replace('/', '_')}_{sample_id:03d}_long",
                        "text": text,
                        "metadata": {
                            "language": language[:2].lower(),
                            "tone": tone,
                            "word_count": count_words(text),
                            "source": "ai_generated",
                            "generator": generator,
                            "domain": domain,
                            "topic": topic,
                            "date_added": datetime.now().strftime("%Y-%m-%d"),
                            "target_word_count": word_target,
                        },
                    }
                )

                print(
                    f"✓ Generated long {tone} sample in {language} using {generator} ({count_words(text)} words)"
                )

    # Save datasets
    dataset_dir = Path(config.DATASET_DIR) / "ai_only"
    dataset_dir.mkdir(parents=True, exist_ok=True)

    # Save short samples
    short_file = dataset_dir / "english_ai_short.json"
    with open(short_file, "w", encoding="utf-8") as f:
        json.dump(datasets["short"], f, indent=2, ensure_ascii=False)
    print(f"\n✅ Saved {len(datasets['short'])} short samples to {short_file}")

    # Save long samples
    long_file = dataset_dir / "english_ai_long.json"
    with open(long_file, "w", encoding="utf-8") as f:
        json.dump(datasets["long"], f, indent=2, ensure_ascii=False)
    print(f"✅ Saved {len(datasets['long'])} long samples to {long_file}")

    print(f"\n🎉 Total samples generated: {len(datasets['short']) + len(datasets['long'])}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate AI test samples")
    parser.add_argument("--samples", type=int, default=2, help="Samples per tone/length")
    parser.add_argument("--openai", action="store_true", default=True, help="Use OpenAI")
    parser.add_argument("--anthropic", action="store_true", default=True, help="Use Anthropic")

    args = parser.parse_args()

    generate_dataset(
        num_samples_per_tone=args.samples, use_openai=args.openai, use_anthropic=args.anthropic
    )
