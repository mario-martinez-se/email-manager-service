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
