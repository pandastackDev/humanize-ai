"""
LLM service for interacting with language models.

Supports:
- OpenRouter (primary)
- OpenAI (fallback)
- Anthropic (fallback)
"""

import logging
from typing import Optional

from api.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    """Service for interacting with LLM providers."""

    def __init__(self):
        """Initialize LLM service with provider configuration."""
        self.openrouter_enabled = bool(settings.OPENROUTER_API_KEY)
        self.openai_enabled = bool(settings.OPENAI_API_KEY)
        self.anthropic_enabled = bool(settings.ANTHROPIC_API_KEY)

        # Initialize clients
        self._init_clients()

    def _init_clients(self) -> None:
        """Initialize LLM provider clients."""
        # OpenRouter client
        if self.openrouter_enabled:
            try:
                from openai import OpenAI

                self.openrouter_client = OpenAI(
                    base_url=settings.OPENROUTER_BASE_URL,
                    api_key=settings.OPENROUTER_API_KEY,
                    default_headers={
                        "HTTP-Referer": settings.OPENROUTER_REFERRER_URL,
                        "X-Title": "Humanize AI",
                    },
                )
                logger.info("OpenRouter client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize OpenRouter client: {e}")
                self.openrouter_enabled = False

        # OpenAI client (fallback)
        if self.openai_enabled:
            try:
                from openai import OpenAI

                self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("OpenAI client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
                self.openai_enabled = False

        # Anthropic client (fallback)
        if self.anthropic_enabled:
            try:
                import anthropic

                self.anthropic_client = anthropic.Anthropic(
                    api_key=settings.ANTHROPIC_API_KEY
                )
                logger.info("Anthropic client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Anthropic client: {e}")
                self.anthropic_enabled = False

    def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> str:
        """
        Generate text using LLM.

        Args:
            prompt: User prompt
            system_prompt: System prompt/instructions
            model: Model name (optional, uses defaults if not provided)
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens to generate

        Returns:
            Generated text

        Raises:
            RuntimeError: If no LLM provider is available
        """
        # Try OpenRouter first
        if self.openrouter_enabled:
            try:
                return self._generate_openrouter(
                    prompt, system_prompt, model, temperature, max_tokens
                )
            except Exception as e:
                logger.warning(f"OpenRouter generation failed: {e}. Trying fallback.")
                if self.openai_enabled or self.anthropic_enabled:
                    pass  # Fall through to fallbacks
                else:
                    raise

        # Try OpenAI fallback
        if self.openai_enabled:
            try:
                return self._generate_openai(
                    prompt, system_prompt, model, temperature, max_tokens
                )
            except Exception as e:
                logger.warning(f"OpenAI generation failed: {e}. Trying Anthropic.")
                if self.anthropic_enabled:
                    pass  # Fall through to Anthropic
                else:
                    raise

        # Try Anthropic fallback
        if self.anthropic_enabled:
            try:
                return self._generate_anthropic(
                    prompt, system_prompt, model, temperature, max_tokens
                )
            except Exception as e:
                logger.error(f"Anthropic generation failed: {e}")
                raise RuntimeError("All LLM providers failed") from e

        raise RuntimeError("No LLM provider available. Please configure API keys.")

    def _generate_openrouter(
        self,
        prompt: str,
        system_prompt: Optional[str],
        model: Optional[str],
        temperature: float,
        max_tokens: Optional[int],
    ) -> str:
        """Generate text using OpenRouter."""
        model_name = model or settings.OPENROUTER_MODEL_GPT4

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = self.openrouter_client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stop=None,  # Don't use stop sequences that might cut off mid-sentence
        )

        content = response.choices[0].message.content
        # Ensure content ends with proper punctuation (don't cut off mid-sentence)
        if content and content[-1] not in ".!?":
            if not content.strip().endswith((".", "!", "?", '"', "'", ")", "]", "}")):
                logger.warning("Response may have been truncated - content doesn't end with punctuation")
        
        return content or ""

    def _generate_openai(
        self,
        prompt: str,
        system_prompt: Optional[str],
        model: Optional[str],
        temperature: float,
        max_tokens: Optional[int],
    ) -> str:
        """Generate text using OpenAI."""
        model_name = model or settings.OPENAI_LLM_MODEL

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = self.openai_client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stop=None,  # Don't use stop sequences that might cut off mid-sentence
        )

        content = response.choices[0].message.content
        # Ensure content ends with proper punctuation (don't cut off mid-sentence)
        if content and content[-1] not in ".!?":
            if not content.strip().endswith((".", "!", "?", '"', "'", ")", "]", "}")):
                logger.warning("Response may have been truncated - content doesn't end with punctuation")
        
        return content or ""

    def _generate_anthropic(
        self,
        prompt: str,
        system_prompt: Optional[str],
        model: Optional[str],
        temperature: float,
        max_tokens: Optional[int],
    ) -> str:
        """Generate text using Anthropic."""
        model_name = model or settings.ANTHROPIC_LLM_MODEL

        # Anthropic uses different message format
        system = system_prompt or "You are a helpful assistant."

        # Anthropic requires max_tokens, use reasonable default if not provided
        effective_max_tokens = max_tokens or 4096
        
        response = self.anthropic_client.messages.create(
            model=model_name,
            max_tokens=effective_max_tokens,
            temperature=temperature,
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )

        content = response.content[0].text
        # Ensure content ends with proper punctuation (don't cut off mid-sentence)
        if content and content[-1] not in ".!?":
            if not content.strip().endswith((".", "!", "?", '"', "'", ")", "]", "}")):
                logger.warning("Response may have been truncated - content doesn't end with punctuation")
        
        return content or ""


