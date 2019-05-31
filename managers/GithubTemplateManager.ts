import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  gql
} from "apollo-client-preset";
import nodeFetch from "node-fetch";
import { TemplateManager } from "./TemplateManager";
import { Template } from "./Template";
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
