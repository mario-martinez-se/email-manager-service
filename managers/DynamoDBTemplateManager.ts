const AWS = require("aws-sdk");
import { TemplateManager } from "./TemplateManager";
import { Template } from "./Template";
export class DynamoDBTemplateManager implements TemplateManager {
  /**
   * This is not used atm. Might be useful if in the future we want to
   * save the templates in DynamoDB, so if Github goes down, we still
   * can access them. Also, is probably more efficient to get the templates
   * from AWS than quering Github.
   */
  private dynamodb: any;
  private tableName: string;
  constructor() {
    this.dynamodb = new AWS.DynamoDB({ region: process.env.myRegion || "" });
    this.tableName = process.env.emailTemplatesTableName || "";
  }
  async getTemplate(key: string): Promise<Template> {
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
}
