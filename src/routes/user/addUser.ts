import express from "express";
import u from "@/utils";
import { db } from "@/utils/db";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { requireAdmin, validateFields } from "@/middleware/middleware";
import bcrypt from "bcryptjs";

const router = express.Router();

// 新增账号(管理员)
export default router.post(
  "/",
  requireAdmin,
  validateFields({
    name: z.string(),
    password: z.string(),
    is_admin: z.number().optional(),
  }),
  async (req, res) => {
    const { name, password, is_admin } = req.body;

    const exist = await u.db("t_user").where("name", name).whereNull("deleted_at").first();
    if (exist) return res.status(400).send(error("账号已存在"));

    const result = await db.transaction(async (trx) => {
      const maxIdResult: any = await trx("t_user").max("id as maxId").first();
      const newId = (maxIdResult?.maxId ?? 0) + 1;
      const hashed = await bcrypt.hash(password, 10);

      await trx("t_user").insert({
        id: newId,
        name,
        password: hashed,
        is_admin: is_admin ? 1 : 0,
        deleted_at: null,
      });

      await initAccountDefaults(newId, trx);
      return newId;
    });

    res.status(200).send(success({ id: result }));
  },
);

async function initAccountDefaults(accountId: number, trx = u.db) {
  const uploadRoot = u.oss.getUploadRootDir?.();
  if (uploadRoot) {
    const accountDir = `${uploadRoot}/${accountId}`;
    try {
      const relPath = `/${accountId}`;
      if (!(await u.oss.dirExists(relPath))) {
        await u.oss.ensureDir(relPath);
      }
    } catch {
      // ignore
    }
  }

  const settingTemplate = await trx("t_setting_account").where("accountId", 1).first();
  if (settingTemplate) {
    const maxSetting: any = await trx("t_setting_account").max("id as maxId").first();
    const nextId = (maxSetting?.maxId ?? 0) + 1;
    const exist = await trx("t_setting_account").where("accountId", accountId).first();
    if (!exist) {
      await trx("t_setting_account")
        .insert({
        id: nextId,
        accountId,
        imageModel: settingTemplate.imageModel ?? "{}",
        languageModel: settingTemplate.languageModel ?? "{}",
      })
        .onConflict("accountId")
        .ignore();
    }
  }

  const configItems = await trx("t_config").where("accountId", 1).select("*");
  if (configItems.length) {
    const maxConfig: any = await trx("t_config").max("id as maxId").first();
    let nextId = (maxConfig?.maxId ?? 0) + 1;
    const configInserts = configItems.map((item: any) => ({
      ...item,
      id: nextId++,
      accountId,
    }));
    await trx("t_config").insert(configInserts).onConflict("id").ignore();
  }

  const promptItems = await trx("t_prompts").where("accountId", 1).select("*");
  if (promptItems.length) {
    const maxPrompt: any = await trx("t_prompts").max("id as maxId").first();
    let nextId = (maxPrompt?.maxId ?? 0) + 1;
    const promptInserts = promptItems.map((item: any) => ({
      ...item,
      id: nextId++,
      accountId,
    }));
    await trx("t_prompts").insert(promptInserts).onConflict(["code", "accountId"]).ignore();
  }

  const aiModelItems = await trx("t_aiModelMap").where("accountId", 1).select("*");
  if (aiModelItems.length) {
    const maxAiModel: any = await trx("t_aiModelMap").max("id as maxId").first();
    let nextId = (maxAiModel?.maxId ?? 0) + 1;
    const aiModelInserts = aiModelItems.map((item: any) => ({
      ...item,
      id: nextId++,
      accountId,
      configId: null,
    }));
    await trx("t_aiModelMap").insert(aiModelInserts).onConflict("id").ignore();
  }
}
