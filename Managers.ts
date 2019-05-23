import Mustache from "mustache";

const AWS = require("aws-sdk");

export class Template {
  subject: string;
  body: string;
  static parseFromDynamoDbItem(item: any): Template {
    return {
      subject: item.subject.S,
      body: item.body.S
    };
  }
}

export class TemplateManager {
  private dynamodb: any;
  private tableName: string;
  constructor() {
    this.dynamodb = new AWS.DynamoDB({ region: process.env.myRegion || "" });
    this.tableName = process.env.emailTemplatesTableName || "";
  }
  async getTemplate(key: string): Promise<Template> {
    console.log(`TableName: ${this.tableName}`);
    const response = await this.dynamodb
      .getItem({
        Key: {
          key: {
            S: key
          }
        },
        TableName: this.tableName
      })
      .promise();
    if (!response.Item) {
      throw new Error(`Couldn't find template with key ${key}`);
    }
    return Template.parseFromDynamoDbItem(response.Item);
  }

  static parseTemplate(template: Template, model: any): string {
    const decodedBody = new Buffer(template.body, "base64").toString("ascii");
    const renderedBody = Mustache.render(decodedBody, model);
    return new Buffer(renderedBody).toString("base64");
  }
}
