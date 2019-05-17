export type Event = UnknownEvent | ReservationConfirmedEvent;
export type UnknownEvent = {
  eventType: "UNKNOWN";
};
export type ReservationConfirmedEvent = {
  eventType: "RESERVATION_CONFIRMED";
  user: {
    email: string;
  };
};
export class EventFactory {
  static buildEvent(base64Data: string): Event {
    const obj = this.decodeData(base64Data);
    if (!obj) {
      return {
        eventType: "UNKNOWN"
      };
    }
    switch (obj.eventType) {
      case "RESERVATION_CONFIRMED":
        return obj as ReservationConfirmedEvent;
      default:
        return {
          eventType: "UNKNOWN"
        };
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
