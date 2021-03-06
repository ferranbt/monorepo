import * as firebase from "firebase/app";
import "firebase/database";

import { NodeMessage } from "./types";

export interface IMessagingService {
  send(to: string, msg: NodeMessage): Promise<void>;
  onReceive(address: string, callback: (msg: NodeMessage) => void);
}

export interface IStoreService {
  get(key: string): Promise<any>;
  // Multiple pairs could be written simultaneously if an atomic write
  // among multiple records is required
  set(pairs: { key: string; value: any }[]): Promise<boolean>;
}

export interface FirebaseAppConfiguration {
  databaseURL: string;
  projectId: string;
  apiKey: string;
  authDomain: string;
  storageBucket: string;
  messagingSenderId: string;
}

export const EMPTY_FIREBASE_CONFIG = {
  databaseURL: "",
  projectId: "",
  apiKey: "",
  authDomain: "",
  storageBucket: "",
  messagingSenderId: ""
};

/**
 * This factory exposes default implementations of the service interfaces
 * described above, using Firebase as the implementation backend.
 */
export class FirebaseServiceFactory {
  private app: firebase.app.App;

  constructor(configuration: FirebaseAppConfiguration) {
    this.app = firebase.initializeApp(configuration);
  }

  static connect(host: string, port: string) {
    return new FirebaseServiceFactory({
      ...EMPTY_FIREBASE_CONFIG,
      databaseURL: `ws://${host}:${port}`
    });
  }

  createMessagingService(messagingServiceKey: string): IMessagingService {
    return new FirebaseMessagingService(
      this.app.database(),
      messagingServiceKey
    );
  }

  createStoreService(storeServiceKey: string): IStoreService {
    return new FirebaseStoreService(this.app.database(), storeServiceKey);
  }
}

class FirebaseMessagingService implements IMessagingService {
  constructor(
    private readonly firebase: firebase.database.Database,
    private readonly messagingServerKey: string
  ) {}

  async send(to: string, msg: NodeMessage) {
    await this.firebase
      .ref(`${this.messagingServerKey}/${to}/${msg.from}`)
      .set(JSON.parse(JSON.stringify(msg)));
  }

  onReceive(address: string, callback: (msg: NodeMessage) => void) {
    if (!this.firebase.app) {
      console.error(
        "Cannot register a connection with an uninitialized firebase handle"
      );
      return;
    }

    const childAddedHandler = async (
      snapshot: firebase.database.DataSnapshot | null
    ) => {
      if (!snapshot) {
        console.error(
          `Node with address ${address} received a "null" snapshot`
        );
        return;
      }

      const msg: NodeMessage = snapshot.val();

      if (msg === null) {
        // We check for `msg` being not null because when the Firebase listener
        // connects, the snapshot starts with a `null` value, and on the second
        // the call it receives a value.
        // See: https://stackoverflow.com/a/37310606/2680092
        return;
      }

      await this.firebase
        .ref(`${this.messagingServerKey}/${address}/${msg.from}`)
        .remove();

      try {
        callback(msg);
      } catch (error) {
        console.error(
          "Encountered an error while handling message callback",
          error
        );
      }
    };

    // Cleans the message inbox upon service start
    this.firebase.ref(`${this.messagingServerKey}/${address}`).remove();

    this.firebase
      .ref(`${this.messagingServerKey}/${address}`)
      .on("child_added", childAddedHandler);
  }
}

class FirebaseStoreService implements IStoreService {
  constructor(
    private readonly firebase: firebase.database.Database,
    private readonly storeServiceKey: string
  ) {}

  async get(key: string): Promise<any> {
    let result: any;
    await this.firebase
      .ref(this.storeServiceKey)
      .child(key)
      .once("value", (snapshot: firebase.database.DataSnapshot | null) => {
        if (snapshot === null) {
          console.debug(
            `Failed to retrieve value at ${key}: received a "null" snapshot`
          );
          return;
        }
        result = snapshot.val();
      });
    return result;
  }

  async set(pairs: { key: string; value: any }[]): Promise<any> {
    const updates = {};
    for (const pair of pairs) {
      updates[pair.key] = JSON.parse(JSON.stringify(pair.value));
    }
    return await this.firebase.ref(this.storeServiceKey).update(updates);
  }
}
