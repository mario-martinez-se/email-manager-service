const AWS = require("aws-sdk");
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  gql
} from "apollo-client-preset";
import nodeFetch from "node-fetch";
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
}

export class GithubTemplateManager implements TemplateManager {
  private client: ApolloClient<any>;

  constructor() {
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

    if (!response) {
      throw new Error(`Template ${key} couldn't be found`);
    }
    return {
      subject: response.data.repository.subject.text,
      body: new Buffer(response.data.repository.body.text).toString("base64")
    };
  }
}
