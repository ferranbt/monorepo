import { Address, Node as NodeTypes } from "@counterfactual/common-types";
import { IMessagingService, IStoreService } from "@counterfactual/node";

// This is a mimic type declaration of the Node, used locally to prevent
// Stencil from blowing up due to "member not exported" errors.
// It's derived from `node.d.ts`.
declare class Node {
  constructor(
    privateKey: string,
    messagingService: IMessagingService,
    storeService: IStoreService,
    nodeConfig: { MULTISIG_KEY_PREFIX: string }
  );
  on(event: string, callback: (res: any) => void): void;
  emit(event: string, req: NodeTypes.MethodRequest): void;
  readonly address: string;
  send(peerAddress: Address, msg: object): Promise<void>;
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<any>;
}

export default class CounterfactualNode {
  private static node: Node;

  static getInstance(): Node {
    return CounterfactualNode.node;
  }

  static create(settings: {
    privateKey: string;
    messagingService: IMessagingService;
    storeService: IStoreService;
    nodeConfig: { MULTISIG_KEY_PREFIX: string };
  }): Node {
    CounterfactualNode.node = new Node(
      settings.privateKey,
      settings.messagingService,
      settings.storeService,
      settings.nodeConfig
    );

    return CounterfactualNode.getInstance();
  }
}