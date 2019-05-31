"use strict";

import { Event, EventFactory, UserData } from "./Events";
import { CommandFactory } from "./Commands";
import { TemplateParser } from "./TemplateParser";
import { GithubTemplateManager, Template, HttpManager } from "./Managers";

module.exports.listener = async event => {
  const messages = event.Records.map(record => record.kinesis);
  await Promise.all(messages.map(processEvent));
  return;
};

module.exports.generate = async event => {
  const body = JSON.parse(event.body);
  console.log(JSON.stringify(body));
  return await new HttpManager().generateResponse(body);
};

async function processEvent(message) {
  console.log(`Processing message ${JSON.stringify(message)}`);
  const event: Event = EventFactory.buildEvent(message.data);
  const command = CommandFactory.buildCommand(event);
  const result = await command.execute();
  console.log(`Result: ${JSON.stringify(result)}`);
  return null;
}
