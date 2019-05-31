const AWS = require("aws-sdk");
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  gql
} from "apollo-client-preset";
import nodeFetch from "node-fetch";
import { UserData } from "./Events";
import { TemplateParser } from "./TemplateParser";
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

export interface TemplateManager {
  getTemplate(key: string): Promise<Template>;
}

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

export class GithubTemplateManager implements TemplateManager {
  private client: ApolloClient<any>;

  constructor() {
    console.log(`${process.env.githubToken}`);
    this.client = new ApolloClient({
      link: new HttpLink({
        uri: "https://api.github.com/graphql",
        fetch: nodeFetch,
        headers: {
          authorization: `bearer ${process.env.githubToken}`
        }
      }),
      cache: new InMemoryCache()
    });
  }

  async getTemplate(key: string): Promise<Template> {
    console.log(`Retrieving template ${key} from github`);
    const query = gql`
    query {
      repository(owner:"mario-martinez-se", name:"email-templates"){
        body:object(expression:"master:${key}.html") {
          ... on Blob {
            text
          }
        }
        subject: object(expression:"master:${key}.title.txt") {
          ... on Blob {
            text
          }
        }
      }
    }
    `;

    const response = await this.client.query<any>({
      query
    });
    if (this.isValidResponse(response)) {
      throw new Error(`Template ${key} couldn't be found`);
    }
    return {
      subject: response.data.repository.subject.text,
      body: new Buffer(response.data.repository.body.text).toString("base64")
    };
  }

  private isValidResponse(response): boolean {
    return (
      !response ||
      !response.data ||
      response.data.repository == null ||
      response.data.repository.subject == null
    );
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

type Response = {
  statusCode: number;
  body: string;
};
