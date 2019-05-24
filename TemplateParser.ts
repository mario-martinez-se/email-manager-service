import { Template } from "./Managers";
import * as Mustache from "mustache";

type EmailParseResult = {
  subject: string;
  body: string;
};
export class TemplateParser {
  private static parseTemplate(
    template: Template,
    model: any
  ): EmailParseResult {
    const decodedBody = new Buffer(template.body, "base64").toString("ascii");
    const renderedBody = Mustache.render(decodedBody, model);
    const renderedSubject = Mustache.render(template.subject, model);
    return {
      subject: renderedSubject,
      body: new Buffer(renderedBody).toString("base64")
    };
  }
  static parseCustomerConfirmationEmail(
    template: Template,
    model: CustomerConfirmationEmailModel
  ): EmailParseResult {
    return this.parseTemplate(template, model);
  }
}

type CustomerConfirmationEmailModel = {
  user: {
    firstName: string;
    lastName: string;
  };
};
