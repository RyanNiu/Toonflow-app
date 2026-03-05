import "../type";
import axios from "axios";

const defaultBaseURL = "https://ai.t8star.cn";

const buildUrl = (baseURL: string, path: string) => {
  const trimmed = baseURL.trim().replace(/\/+$/, "");
  if (trimmed.includes("/images/generations")) return trimmed;
  let normalized = trimmed;
  if (path.startsWith("/v1/") && normalized.endsWith("/v1")) {
    normalized = normalized.slice(0, -3);
  }
  return `${normalized}${path}`;
};

const withBearer = (apiKey: string) => (apiKey.startsWith("Bearer ") ? apiKey : `Bearer ${apiKey}`);

export default async (input: ImageConfig, config: AIConfig): Promise<string> => {
  if (!config.model) throw new Error("缺少Model名称");
  if (!config.apiKey) throw new Error("缺少API Key");

  const requestUrl = buildUrl(config.baseURL || defaultBaseURL, "/v1/images/generations");
  const fullPrompt = input.systemPrompt ? `${input.systemPrompt}\n\n${input.prompt}` : input.prompt;
  const responseFormat = input.resType === "b64" ? "b64_json" : "url";

  const body: Record<string, any> = {
    model: config.model,
    prompt: fullPrompt,
    response_format: responseFormat,
  };

  if (input.aspectRatio) body.aspect_ratio = input.aspectRatio;
  if (input.imageBase64 && input.imageBase64.length) body.image = input.imageBase64;
  if (input.size) body.image_size = input.size;

  console.log("[ZZGF Image] Request", {
    url: requestUrl,
    model: config.model,
    response_format: responseFormat,
    aspect_ratio: body.aspect_ratio,
    image_size: body.image_size,
    has_image: Array.isArray(body.image) ? body.image.length : 0,
  });

  let data: any;
  let status: number | undefined;
  try {
    const response = await axios.post(requestUrl, body, {
      headers: {
        Authorization: withBearer(config.apiKey),
        "Content-Type": "application/json",
      },
    });
    data = response.data;
    status = response.status;
  } catch (error: any) {
    const resData = error?.response?.data;
    const resStatus = error?.response?.status;
    console.error("[ZZGF Image] Error", {
      status: resStatus,
      dataPreview: JSON.stringify(resData ?? {}).slice(0, 500),
    });
    throw error;
  }

  console.log("[ZZGF Image] Response", {
    status,
    dataPreview: JSON.stringify(data ?? {}).slice(0, 500),
  });

  const payload = data?.data ?? data;
  const first = Array.isArray(payload) ? payload[0] : payload;

  if (typeof first === "string") return first;
  if (first?.url) return first.url;
  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;

  throw new Error(`图片生成失败: ${JSON.stringify(data ?? {}, null, 2)}`);
};
