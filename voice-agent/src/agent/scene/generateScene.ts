export async function generateSceneImage(
  hfToken: string | undefined,
  prompt: string
): Promise<{ dataUri: string; error?: string }> {
  if (!hfToken) {
    return { dataUri: "", error: "HF_TOKEN not configured" };
  }
  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { num_inference_steps: 4, guidance_scale: 0 },
        }),
      }
    );
    if (!res.ok) {
      return { dataUri: "", error: `HF error ${res.status}` };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const b64 = buf.toString("base64");
    return { dataUri: `data:image/png;base64,${b64}` };
  } catch (e) {
    return { dataUri: "", error: String(e) };
  }
}
