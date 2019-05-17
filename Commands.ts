import axios from "axios";
import { Event, ReservationConfirmedEvent } from "./Events";
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
    return this.sendCustomerConfirmationEmail();
  }

  private async sendCustomerConfirmationEmail(): Promise<CommandResult> {
    try {
      await axios.post(
        "https://8osc0nz9n6.execute-api.eu-west-1.amazonaws.com/dev/mail/queue",
        {
          email: this.event.user.email,
          subject: "Here is your confirmation email!",
          sender: "mario.martinez+sender@secretescapes.com",
          body:
            "PGh0bWw+CjxoZWFkPjwvaGVhZD4KPGJvZHk+CiAgPGgxPkFtYXpvbiBTRVMgVGVzdCAoU0RLIGZvciBQeXRob24pPC9oMT4KICA8cD5UaGlzIGVtYWlsIHdhcyBzZW50IHdpdGgKICAgIDxhIGhyZWY9J2h0dHBzOi8vYXdzLmFtYXpvbi5jb20vc2VzLyc+QW1hem9uIFNFUzwvYT4gdXNpbmcgdGhlCiAgICA8YSBocmVmPSdodHRwczovL2F3cy5hbWF6b24uY29tL3Nkay1mb3ItcHl0aG9uLyc+CiAgICAgIEFXUyBTREsgZm9yIFB5dGhvbiAoQm90byk8L2E+LjwvcD4KPC9ib2R5Pgo8L2h0bWw+"
        }
      );
      console.info("Response sent");
      return { success: true };
    } catch (error) {
      console.error(`Error sending response: ${error}`);
      return { success: false };
    }
  }
}
class NopCommand implements Command {
  async execute() {
    return { success: true };
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
