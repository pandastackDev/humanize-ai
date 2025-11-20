"""
LLM service for interacting with language models.

Supports:
- OpenRouter (primary)
- OpenAI (fallback)
- Anthropic (fallback)
"""

import logging

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

                self.anthropic_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
                logger.info("Anthropic client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Anthropic client: {e}")
                self.anthropic_enabled = False

    def generate_text(
        self,
        prompt: str,
        system_prompt: str | None = None,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
        top_p: float | None = None,
        frequency_penalty: float | None = None,
        presence_penalty: float | None = None,
    ) -> str:
        """
        Generate text using LLM with Claude 3.5 Sonnet as primary for humanization.

        Priority order for humanization:
        1. Claude 3.5 Sonnet (via OpenRouter or Anthropic) - Best for naturalness
        2. GPT-4 Turbo (via OpenRouter or OpenAI) - Good fallback
        3. Claude 3 Opus - Alternative fallback

        Args:
            prompt: User prompt
            system_prompt: System prompt/instructions
            model: Model name (optional, uses PRIMARY_HUMANIZATION_MODEL if not provided)
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens to generate
            top_p: Nucleus sampling parameter
            frequency_penalty: Frequency penalty for token repetition
            presence_penalty: Presence penalty for topic repetition

        Returns:
            Generated text

        Raises:
            RuntimeError: If no LLM provider is available
        """
        # Use configured primary model if none specified
        target_model = model or settings.PRIMARY_HUMANIZATION_MODEL

        # Determine which provider to use based on model
        if "claude" in target_model.lower() or "anthropic" in target_model.lower():
            # Try Claude models first (best for humanization)
            providers = [
                ("anthropic", target_model),
                ("openrouter", target_model),
                ("openai", settings.FALLBACK_HUMANIZATION_MODEL),
            ]
        else:
            # OpenAI or other models
            providers = [
                ("openrouter", target_model),
                ("openai", target_model),
                ("anthropic", settings.PRIMARY_HUMANIZATION_MODEL),
            ]

        last_error = None
        for provider_type, model_name in providers:
            try:
                if provider_type == "anthropic" and self.anthropic_enabled:
                    logger.info(f"Trying Anthropic with model: {model_name}")
                    return self._generate_anthropic(
                        prompt, system_prompt, model_name, temperature, max_tokens
                    )
                elif provider_type == "openrouter" and self.openrouter_enabled:
                    logger.info(f"Trying OpenRouter with model: {model_name}")
                    return self._generate_openrouter(
                        prompt,
                        system_prompt,
                        model_name,
                        temperature,
                        max_tokens,
                        top_p,
                        frequency_penalty,
                        presence_penalty,
                    )
                elif provider_type == "openai" and self.openai_enabled:
                    logger.info(f"Trying OpenAI with model: {model_name}")
                    return self._generate_openai(
                        prompt,
                        system_prompt,
                        model_name,
                        temperature,
                        max_tokens,
                        top_p,
                        frequency_penalty,
                        presence_penalty,
                    )
            except Exception as e:
                logger.warning(
                    f"{provider_type} generation with {model_name} failed: {e}. Trying next provider."
                )
                last_error = e
                continue

        # If all providers failed
        error_msg = f"All LLM providers failed. Last error: {last_error}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)

    def _generate_openrouter(
        self,
        prompt: str,
        system_prompt: str | None,
        model: str | None,
        temperature: float,
        max_tokens: int | None,
        top_p: float | None = None,
        frequency_penalty: float | None = None,
        presence_penalty: float | None = None,
    ) -> str:
        """Generate text using OpenRouter."""
        model_name = model or settings.OPENROUTER_MODEL_CLAUDE35

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        # Build kwargs with optional parameters
        kwargs = {
            "model": model_name,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stop": None,  # Don't use stop sequences that might cut off mid-sentence
        }

        if top_p is not None:
            kwargs["top_p"] = top_p
        if frequency_penalty is not None:
            kwargs["frequency_penalty"] = frequency_penalty
        if presence_penalty is not None:
            kwargs["presence_penalty"] = presence_penalty

        response = self.openrouter_client.chat.completions.create(**kwargs)

        content = response.choices[0].message.content
        # Ensure content ends with proper punctuation (don't cut off mid-sentence)
        if content and content[-1] not in ".!?":
            if not content.strip().endswith((".", "!", "?", '"', "'", ")", "]", "}")):
                logger.warning(
                    "Response may have been truncated - content doesn't end with punctuation"
                )

        return content or ""

    def _generate_openai(
        self,
        prompt: str,
        system_prompt: str | None,
        model: str | None,
        temperature: float,
        max_tokens: int | None,
        top_p: float | None = None,
        frequency_penalty: float | None = None,
        presence_penalty: float | None = None,
    ) -> str:
        """Generate text using OpenAI."""
        model_name = model or settings.OPENAI_LLM_MODEL

        # Strip OpenRouter prefix (e.g., "openai/gpt-4-turbo" -> "gpt-4-turbo")
        if "/" in model_name:
            model_name = model_name.split("/", 1)[1]

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        # Build kwargs with optional parameters
        kwargs = {
            "model": model_name,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stop": None,  # Don't use stop sequences that might cut off mid-sentence
        }

        if top_p is not None:
            kwargs["top_p"] = top_p
        if frequency_penalty is not None:
            kwargs["frequency_penalty"] = frequency_penalty
        if presence_penalty is not None:
            kwargs["presence_penalty"] = presence_penalty

        response = self.openai_client.chat.completions.create(**kwargs)

        content = response.choices[0].message.content
        # Ensure content ends with proper punctuation (don't cut off mid-sentence)
        if content and content[-1] not in ".!?":
            if not content.strip().endswith((".", "!", "?", '"', "'", ")", "]", "}")):
                logger.warning(
                    "Response may have been truncated - content doesn't end with punctuation"
                )

        return content or ""

    def _generate_anthropic(
        self,
        prompt: str,
        system_prompt: str | None,
        model: str | None,
        temperature: float,
        max_tokens: int | None,
    ) -> str:
        """Generate text using Anthropic."""
        model_name = model or settings.ANTHROPIC_LLM_MODEL

        # Strip OpenRouter prefix (e.g., "anthropic/claude-3-5-sonnet" -> "claude-3-5-sonnet")
        if "/" in model_name:
            model_name = model_name.split("/", 1)[1]

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

        # Extract text from response - handle different content block types
        if not response.content or len(response.content) == 0:
            raise ValueError("Anthropic response has no content")

        first_block = response.content[0]
        # Check if it's a TextBlock with .text attribute
        if hasattr(first_block, "text"):
            content = first_block.text  # type: ignore[attr-defined]
        else:
            # Handle other block types (ThinkingBlock, ToolUseBlock, etc.)
            raise ValueError(f"Unexpected content block type: {type(first_block)}")
        # Ensure content ends with proper punctuation (don't cut off mid-sentence)
        if content and content[-1] not in ".!?":
            if not content.strip().endswith((".", "!", "?", '"', "'", ")", "]", "}")):
                logger.warning(
                    "Response may have been truncated - content doesn't end with punctuation"
                )

        return content or ""
