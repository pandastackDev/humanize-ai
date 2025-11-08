// biome-ignore lint/suspicious/useAwait: todo
export async function GET(_request: Request) {
  return new Response("Hello, Solito!");
}
