"use strict";

import { Event, EventFactory, ReservationConfirmedEvent } from "./Events";

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

interface CommandResult {
  success: boolean;
}
interface Command {
  execute(): Promise<CommandResult>;
}

class ReservationConfirmedCommand implements Command {
  private event: ReservationConfirmedEvent;
  constructor(event: ReservationConfirmedEvent) {
    this.event = event;
  }
  async execute() {
    console.log(
      `Executing reservation confirm command: ${JSON.stringify(this.event)}`
    );
    return { success: true };
  }
}

class NopCommand implements Command {
  async execute() {
    return { success: true };
  }
}
class CommandFactory {
  static buildCommand(event: Event): Command {
    console.log(`eventType: ${event.eventType}`);
    switch (event.eventType) {
      case "RESERVATION_CONFIRMED":
        return new ReservationConfirmedCommand(event);
      default:
        return new NopCommand();
    }
  }
}
