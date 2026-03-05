import { db } from "./db";
interface AiConfig {
  model?: string;
  apiKey: string;
  baseURL?: string;
  manufacturer: string;
}

export default async function getPromptAi(key: string, accountId?: number, projectId?: number): Promise<AiConfig | {}> {
  return getPromptAiWithAccount(key, accountId, projectId);
}

async function getPromptAiWithAccount(key: string, accountId?: number, projectId?: number): Promise<AiConfig | {}> {
  let effectiveAccountId = accountId;
  if (!effectiveAccountId && projectId) {
    const project = await db("t_project").where({ id: projectId }).select("accountId").first();
    effectiveAccountId = Number(project?.accountId) || undefined;
  }
  if (!effectiveAccountId) effectiveAccountId = 1;

  const aiConfigData = await db("t_aiModelMap")
    .leftJoin("t_config", "t_config.id", "t_aiModelMap.configId")
    .where("t_aiModelMap.key", key)
    .andWhere("t_aiModelMap.accountId", effectiveAccountId)
    .select("t_config.model", "t_config.apiKey", "t_config.baseUrl as baseURL", "t_config.manufacturer")
    .first();

  if (aiConfigData) {
    return aiConfigData as AiConfig;
  } else return {};
}

export async function getPromptAiForAccount(key: string, accountId: number): Promise<AiConfig | {}> {
  return getPromptAiWithAccount(key, accountId);
}

export async function getPromptAiForProject(key: string, projectId: number): Promise<AiConfig | {}> {
  return getPromptAiWithAccount(key, undefined, projectId);
}
