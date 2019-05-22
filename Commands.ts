import axios from "axios";
import { Event, ReservationConfirmedEvent } from "./Events";
import { TemplateManager, Template } from "./Managers";
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
      const templateManager = new TemplateManager();
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
      //TODO: move this to somewhere else
      await axios.post(process.env.emailServiceUrl || "", {
        email: this.event.user.email || "",
        subject: template.subject, //"Here is your confirmation email!",
        sender: process.env.emailSender,
        body: template.body //"PGh0bWw+CjxoZWFkPjwvaGVhZD4KPGJvZHk+CiAgPGgxPkFtYXpvbiBTRVMgVGVzdCAoU0RLIGZvciBQeXRob24pPC9oMT4KICA8cD5UaGlzIGVtYWlsIHdhcyBzZW50IHdpdGgKICAgIDxhIGhyZWY9J2h0dHBzOi8vYXdzLmFtYXpvbi5jb20vc2VzLyc+QW1hem9uIFNFUzwvYT4gdXNpbmcgdGhlCiAgICA8YSBocmVmPSdodHRwczovL2F3cy5hbWF6b24uY29tL3Nkay1mb3ItcHl0aG9uLyc+CiAgICAgIEFXUyBTREsgZm9yIFB5dGhvbiAoQm90byk8L2E+LjwvcD4KPC9ib2R5Pgo8L2h0bWw+"
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
