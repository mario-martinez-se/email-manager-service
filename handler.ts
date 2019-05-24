"use strict";

import { Event, EventFactory, UserData, isUserData } from "./Events";
import { CommandFactory } from "./Commands";
import { UserInfo } from "os";
import { TemplateParser } from "./TemplateParser";
import { GithubTemplateManager, Template } from "./Managers";

module.exports.listener = async event => {
  const messages = event.Records.map(record => record.kinesis);
  await Promise.all(messages.map(processEvent));
  return;
};

type GenerateEmailRequest = {
  templateName: string;
  user: UserData;
};

function isGenerateEmailRequest(obj: any): obj is GenerateEmailRequest {
  return (
    obj &&
    typeof obj === "object" &&
    obj["templateName"] === "string" &&
    isUserData(obj["user"])
  );
}
module.exports.generate = async event => {
  //TODO: Fix this lambda
  console.log(JSON.stringify(event));
  const body = JSON.parse(event.body);
  if (!isGenerateEmailRequest(body)) {
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          message: "Incorrect request"
        },
        null,
        2
      )
    };
  }

  const templateManager = new GithubTemplateManager();
  const template: Template = await templateManager.getTemplate(
    body.templateName
  );
  if (!template) {
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          message: "Unknown template"
        },
        null,
        2
      )
    };
  }

  const emailParsed = TemplateParser.parseCustomerConfirmationEmail(
    template,
    body
  );
  return {
    statusCode: 200,
    body: emailParsed.body
  };
};

async function processEvent(message) {
  console.log(`Processing message ${JSON.stringify(message)}`);
  const event: Event = EventFactory.buildEvent(message.data);
  const command = CommandFactory.buildCommand(event);
  const result = await command.execute();
  console.log(`Result: ${JSON.stringify(result)}`);
  return null;
}
