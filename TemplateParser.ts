import { Template } from "./Managers";
import * as Mustache from "mustache";

export class TemplateParser {
  private static parseTemplate(template: Template, model: any): string {
    const decodedBody = new Buffer(template.body, "base64").toString("ascii");
    const renderedBody = Mustache.render(decodedBody, model);
    return new Buffer(renderedBody).toString("base64");
  }
  static parseCustomerConfirmationEmail(
    template: Template,
    model: CustomerConfirmationEmailModel
  ) {
    return this.parseTemplate(template, model);
  }
}

type CustomerConfirmationEmailModel = {
  user: {
    firstName: string;
    lastName: string;
  };
};
