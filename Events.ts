export type Event = UnknownEvent | ReservationConfirmedEvent;
export type UnknownEvent = {
  eventType: "UNKNOWN";
};

export type UserData = {
  email: string;
  firstName: string;
  lastName: string;
};
export function isUserData(obj: any): obj is UserData {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj["email"] == "string" &&
    typeof obj["firstName"] == "string" &&
    typeof obj["lastName"] == "string"
  );
}
export type ReservationConfirmedEvent = {
  eventType: "RESERVATION_CONFIRMED";
  // TODO: This will need to contain all the useful information about the reservation
  user: UserData;
};

function isReservationConfirmedEvent(
  obj: any
): obj is ReservationConfirmedEvent {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj["eventType"] === "string" &&
    typeof obj["user"] === "object" &&
    isUserData(obj.user)
  );
}

export class EventFactory {
  static buildEvent(base64Data: string): Event {
    const unknownEvent: UnknownEvent = {
      eventType: "UNKNOWN"
    };
    const obj = this.decodeData(base64Data);
    if (!obj) {
      return {
        eventType: "UNKNOWN"
      };
    }
    switch (obj.eventType) {
      case "RESERVATION_CONFIRMED":
        return isReservationConfirmedEvent(obj) ? obj : unknownEvent;
      default:
        return unknownEvent;
    }
  }
  static decodeData(base64Data: string): any {
    try {
      return JSON.parse(
        JSON.parse(new Buffer(base64Data, "base64").toString("ascii")).data
      );
    } catch (err) {
      console.error(err);
    }
    return null;
  }
}
