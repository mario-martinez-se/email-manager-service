import { Template } from "./Template";
export interface TemplateManager {
  getTemplate(key: string): Promise<Template>;
}
