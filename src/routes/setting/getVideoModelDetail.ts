import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import { getAccountId } from "@/middleware/middleware";
const router = express.Router();

const T8STAR_BASE_URL = "https://ai.t8star.cn";
const ZZGF_DURATION_RESOLUTION_MAP = [
  {
    duration: [
      2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    ],
    resolution: ["480p", "720p", "1080p", "2k", "4k"],
  },
];
const ZZGF_ASPECT_RATIO = ["16:9", "9:16"];
const ZZGF_TYPE = ["singleImage", "startEndRequired", "multiImage"];

const normalizeBaseUrl = (value?: string | null) => (value ?? "").trim().replace(/\/+$/, "").toLowerCase();
const isT8StarBaseUrl = (value?: string | null) => {
  const normalized = normalizeBaseUrl(value);
  if (!normalized) return false;
  const target = normalizeBaseUrl(T8STAR_BASE_URL);
  return normalized === target || normalized.startsWith(`${target}/`);
};

export default router.post("/", async (req, res) => {
  const accountId = getAccountId(req) ?? 1;
  const videoData = await u.db("t_videoModel").select("*");
  const allData = videoData.map((i) => {
    const durationResolutionMap = JSON.parse(i.durationResolutionMap ?? "[]");
    const aspectRatio = JSON.parse(i.aspectRatio ?? "[]");
    const type = JSON.parse(i.type ?? "[]");
    return {
      ...i,
      durationResolutionMap,
      aspectRatio,
      type,
      audio: i.audio === 1,
    };
  });

  const configRows = await u
    .db("t_config")
    .where({ type: "video", accountId })
    .select("model", "manufacturer", "baseUrl");
  const t8starConfigs = configRows.filter((row) => isT8StarBaseUrl(row.baseUrl));
  if (t8starConfigs.length) {
    for (const row of t8starConfigs) {
      const model = (row.model ?? "").trim();
      if (!model) continue;
      const manufacturer = (row.manufacturer ?? "zzgf").trim() || "zzgf";
      const index = allData.findIndex((item) => item.model === model && item.manufacturer === manufacturer);
      const zzgfDefaults = {
        durationResolutionMap: ZZGF_DURATION_RESOLUTION_MAP,
        aspectRatio: ZZGF_ASPECT_RATIO,
        type: ZZGF_TYPE,
        audio: false,
      };
      if (index >= 0) {
        allData[index] = { ...allData[index], ...zzgfDefaults };
      } else {
        allData.push({ manufacturer, model, ...zzgfDefaults });
      }
    }
  }

  const otherConfig = {
    manufacturer: "other",
    model: "",
    durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "720p", "1080p"] }],
    aspectRatio: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9"],
    type: ["text", "endFrameOptional", "singleImage", "multiImage"],
    audio: true,
  };
  const returnData = [otherConfig, ...allData];
  res.status(200).send(success(returnData));
});
