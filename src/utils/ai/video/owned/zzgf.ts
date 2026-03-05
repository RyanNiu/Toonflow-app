import "../type";
import axios from "axios";
import { pollTask } from "@/utils/ai/utils";

const defaultBaseURL = "https://ai.t8star.cn";

const buildUrl = (baseURL: string, path: string) => {
  const trimmed = baseURL.trim().replace(/\/+$/, "");
  if (trimmed.includes("/videos/generations")) return trimmed;
  let normalized = trimmed;
  if (path.startsWith("/v2/") && normalized.endsWith("/v2")) {
    normalized = normalized.slice(0, -3);
  }
  if (path.startsWith("/v2/") && normalized.endsWith("/v1")) {
    normalized = normalized.slice(0, -3);
  }
  return `${normalized}${path}`;
};

const resolveUrls = (baseURL?: string) => {
  const url = (baseURL || defaultBaseURL).trim();
  if (url.includes("|")) {
    const [submitUrl, queryUrl] = url.split("|").map((part) => part.trim());
    if (!submitUrl || !queryUrl) throw new Error("baseURL 格式错误，请使用 submitUrl|queryUrl");
    return { submitUrl, queryUrl };
  }
  const submitUrl = buildUrl(url, "/v2/videos/generations");
  return { submitUrl, queryUrl: submitUrl };
};

const withBearer = (apiKey: string) => (apiKey.startsWith("Bearer ") ? apiKey : `Bearer ${apiKey}`);

export default async (input: VideoConfig, config: AIConfig) => {
  if (!config.model) throw new Error("缺少Model名称");
  if (!config.apiKey) throw new Error("缺少API Key");

  const { submitUrl, queryUrl } = resolveUrls(config.baseURL);
  const headers = {
    Authorization: withBearer(config.apiKey),
    "Content-Type": "application/json",
  };

  const body: Record<string, any> = {
    model: config.model,
    prompt: input.prompt,
    images: input.imageBase64 ?? [],
    aspect_ratio: input.aspectRatio,
    duration: String(input.duration),
  };

  const { data } = await axios.post(submitUrl, body, { headers });
  const payload = data?.data ?? data;
  const directUrl = payload?.url || payload?.video_url || payload?.data?.url;
  if (directUrl) return directUrl;

  const taskId = payload?.task_id || payload?.id || payload?.data?.task_id || payload?.data?.id;
  if (!taskId) throw new Error(`任务提交失败: ${JSON.stringify(data ?? {}, null, 2)}`);

  return await pollTask(async () => {
    let queryData: any;
    try {
      const res = await axios.get(`${queryUrl}/${taskId}`, { headers });
      queryData = res.data;
    } catch (error) {
      const res = await axios.get(queryUrl, { headers, params: { id: taskId } });
      queryData = res.data;
    }

    const result = queryData?.data ?? queryData;
    const url = result?.url || result?.video_url || result?.data?.url;
    if (url) return { completed: true, url };

    const status = String(result?.status || result?.state || result?.data?.status || "").toLowerCase();
    if (["failed", "error"].includes(status)) {
      return { completed: false, error: result?.error || result?.message || "视频生成失败" };
    }
    return { completed: false };
  });
};
