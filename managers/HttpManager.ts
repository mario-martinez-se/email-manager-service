import { UserData } from "../Events";
import { TemplateParser } from "../TemplateParser";
import { GithubTemplateManager } from "./GithubTemplateManager";
import { Template } from "./Template";
export class HttpManager {
  async generateResponse(body: GenerateEmailRequest): Promise<Response> {
    try {
      return this.formatResponse(200, await this.generateBody(body));
    } catch (err) {
      return this.formatResponse(400, err.toString());
    }
  }
  private async generateBody(body: GenerateEmailRequest): Promise<string> {
    if (!GenerateEmailRequest.isOfType(body)) {
      throw new Error(`Incorrect request`);
    }
    const templateManager = new GithubTemplateManager();
    const template: Template = await templateManager.getTemplate(
      body.templateName
    );
    if (!template) {
      throw new Error(`Unkown template`);
    }
    const emailParsed = TemplateParser.parseCustomerConfirmationEmail(
      template,
      body
    );
    return emailParsed.body;
  }
  private formatResponse(statusCode: number, body: string): Response {
    return {
      statusCode,
      body
    };
  }
}
class GenerateEmailRequest {
  templateName: string;
  user: UserData;
  static isOfType(obj: any): obj is GenerateEmailRequest {
    return (
      obj &&
      typeof obj === "object" &&
      typeof obj["templateName"] === "string" &&
      UserData.isOfType(obj["user"])
    );
  }
}
type Response = {
  statusCode: number;
  body: string;
};
