"use strict";

import { Event, EventFactory } from "./Events";
import { CommandFactory } from "./Commands";

module.exports.listener = async event => {
  console.log(JSON.stringify(event));
  const messages = event.Records.map(record => record.kinesis);
  await Promise.all(messages.map(processEvent));
  return;
};

async function processEvent(message) {
  console.log(`Processing message ${JSON.stringify(message)}`);
  const event: Event = EventFactory.buildEvent(message.data);
  console.log(`EVENT IS: ${JSON.stringify(event)}`);
  const command = CommandFactory.buildCommand(event);
  const result = await command.execute();
  console.log(`Result: ${JSON.stringify(result)}`);
  return null;
}
