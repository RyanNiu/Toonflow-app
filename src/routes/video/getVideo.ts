import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
import { getProjectForAccount } from "@/utils/projectAccess";
const router = express.Router();
interface TempAsset {
  videoId: number;
  filePath: string;
  type: string;
}

// 获取视频
export default router.post(
  "/",
  validateFields({
    scriptId: z.number(),
    specifyIds: z.array(z.number()).optional(),
  }),
  async (req, res) => {
    const { scriptId, specifyIds } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const script = await u.db("t_script").where("id", scriptId).first();
    if (!script) return res.status(404).send({ message: "剧本不存在" });
    const projectId = Number(script.projectId);
    if (!projectId) return res.status(400).send({ message: "项目不存在" });
    const project = await getProjectForAccount(accountId, projectId);
    if (!project) return res.status(404).send({ message: "项目不存在" });

    const videos = await u
      .db("t_video")
      .where("scriptId", scriptId)
      .modify((qb) => {
        if (specifyIds && specifyIds.length) {
          qb.whereIn("id", specifyIds);
        }
      })
      .select("id", "configId", "time", "resolution", "prompt", "firstFrame", "filePath", "storyboardImgs", "model", "scriptId", "state","errorReason");
    // const videoIds: number[] = videos.map((video: any) => (typeof video.id === "string" ? parseInt(video.id) : video.id));

    // let tempAssets: TempAsset[] = await u
    //   .db("t_tempAssets")
    //   .whereIn("videoId", videoIds)
    //   .whereNot("filePath", "")
    //   .select("videoId", "filePath", "type");

    // tempAssets = await Promise.all(
    //   tempAssets.map(async (asset) => {
    //     const signedFilePath = asset.filePath ? await u.oss.getFileUrl(asset.filePath) : "";
    //     return {
    //       ...asset,
    //       filePath: signedFilePath,
    //     };
    //   })
    // );

    // const tempAssetsMap: Record<number, TempAsset[]> = {};
    // tempAssets.forEach((asset) => {
    //   if (!tempAssetsMap[asset.videoId]) {
    //     tempAssetsMap[asset.videoId] = [];
    //   }
    //   tempAssetsMap[asset.videoId]!.push(asset);
    // });

    const data = await Promise.all(
      videos.map(async (video: any) => {
        let storyboardImgs: string[] = [];
        if (video.storyboardImgs) {
          try {
            storyboardImgs = Array.isArray(video.storyboardImgs) ? video.storyboardImgs : JSON.parse(video.storyboardImgs);
          } catch (err) {
            storyboardImgs = [];
          }
        }
        const signedStoryboardImgs = await Promise.all(storyboardImgs.map((img) => (img ? u.oss.getFileUrl(img) : "")));
        const signedFilePath = video.filePath ? await u.oss.getFileUrl(video.filePath) : "";
        const signedFirstFrame = video.firstFrame ? await u.oss.getFileUrl(video.firstFrame) : "";
        const videoId = typeof video.id === "string" ? parseInt(video.id) : video.id;
        return {
          ...video,
          filePath: signedFilePath,
          firstFrame: signedFirstFrame,
          storyboardImgs: signedStoryboardImgs,
          // tempAssets: tempAssetsMap[videoId] || [],
        };
      }),
    );
    res.status(200).send(success(data));
  },
);
