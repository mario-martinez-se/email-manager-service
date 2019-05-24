import axios from "axios";
import { Event, ReservationConfirmedEvent } from "./Events";
import { TemplateManager, Template, GithubTemplateManager } from "./Managers";
import { TemplateParser } from "./TemplateParser";
import { CommandResult, FAILURE, SUCCESS } from "./CommandResult";
interface Command {
  execute(): Promise<CommandResult>;
}

class NopCommand implements Command {
  async execute() {
    return { success: true };
  }
}

class ReservationConfirmedCommand implements Command {
  private event: ReservationConfirmedEvent;
  private readonly TEMPLATE_KEY = "RESERVATION_CONFIRMED";

  constructor(event: ReservationConfirmedEvent) {
    this.event = event;
  }
  async execute(): Promise<CommandResult> {
    try {
      console.log(
        `Executing reservation confirm command: ${JSON.stringify(this.event)}`
      );
      const templateManager = new GithubTemplateManager();
      return this.sendCustomerConfirmationEmail(
        await templateManager.getTemplate(this.TEMPLATE_KEY)
      );
    } catch (err) {
      console.error(`Error executing ReservationConfirmedEvent: ${err}`);
      return FAILURE;
    }
  }

  private async sendCustomerConfirmationEmail(
    template: Template
  ): Promise<CommandResult> {
    try {
      const parsedEmail = TemplateParser.parseCustomerConfirmationEmail(
        template,
        this.event
      );
      //TODO: move this to somewhere else
      await axios.post(process.env.emailServiceUrl || "", {
        email: this.event.user.email || "",
        subject: parsedEmail.subject,
        sender: process.env.emailSender,
        body: parsedEmail.body
      });
      console.info("Response sent");
      return SUCCESS;
    } catch (error) {
      console.error(`Error sending response: ${error}`);
      return FAILURE;
    }
  }
}
export class CommandFactory {
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
