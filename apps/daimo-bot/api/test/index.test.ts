import { NeynarAPIClient } from "@neynar/nodejs-sdk";

import {
  CONNECT_FC_MESSAGE,
  PAYMENT_CONNECT_FC_MESSAGE,
  REQUEST_PAYMENT_MESSAGE,
} from "../botResponses";
import { DaimobotProcessor } from "../daimobotProcessor";
import { trpcClient } from "../trpcClient";
import { TRPCClient } from "../types";

const senderUsername = "alice";
const amount = 15;

const mockEvent = {
  data: {
    object: "cast",
    hash: "mockHash",
    parent_author: {
      fid: null,
    },
    author: {
      fid: 1,
      username: senderUsername,
    },
    text: `@daimobot request $${amount}`,
    timestamp: "2090-01-01T00:00:00Z",
  },
};
const validAddress = "0x123";

describe("tryExtractCommand()", () => {
  it("extracts proper request command", () => {
    const processor = new DaimobotProcessor(mockEvent);
    const result = processor._tryExtractCommand();

    expect(result).toEqual({
      action: "request",
      cleanedAmount: 15,
    });
  });

  it("extracts proper pay command", () => {
    const mockEventPayCommand = {
      data: {
        ...mockEvent.data,
        text: "@daimobot pay $30",
      },
    };

    const processor = new DaimobotProcessor(mockEventPayCommand);
    const result = processor._tryExtractCommand();

    expect(result).toEqual({
      action: "pay",
      cleanedAmount: 30,
    });
  });

  it("returns null when invalid command is present", () => {
    const mockEventInvalidCommand = {
      data: {
        ...mockEvent.data,
        text: "@daimobot pay $-30",
      },
    };

    const processor = new DaimobotProcessor(mockEventInvalidCommand);
    const result = processor._tryExtractCommand();

    expect(result).toBeNull();
  });
});

describe("daimobotProcessor", () => {
  let mockTrpcClient: TRPCClient;
  let mockNeynarClient: NeynarAPIClient;
  beforeEach(() => {
    jest.clearAllMocks();
    mockTrpcClient = {
      ...trpcClient,
      createRequestSponsored: {
        mutate: jest.fn().mockRejectedValue(new Error("should not be called")),
      },
      lookupEthereumAccountByFid: {
        query: jest.fn().mockResolvedValue(null), // Alice doesn't have FC linked
      },
    };

    mockNeynarClient = {
      publishCast: jest.fn().mockResolvedValue("should be overridden"),
      fetchBulkUsers: jest
        .fn()
        .mockRejectedValue(new Error("should not be called")),
    } as unknown as NeynarAPIClient;
  });

  it("handles Case 1: Alice doesn't have FC linked ❌, requests $ from anyone", async () => {
    // Action 1: Daimobot responds with a link to register with Farcaster. Alice registers, then Daimobot responds with a link to request $

    const processor = new DaimobotProcessor(
      mockEvent,
      mockTrpcClient,
      mockNeynarClient
    );

    await processor.process();

    // Without FC linked, Daimobot should request sender to connect their FC
    expect(mockNeynarClient.publishCast).toHaveBeenCalledWith(
      expect.any(String),
      CONNECT_FC_MESSAGE,
      expect.anything()
    );
    expect(mockNeynarClient.publishCast).toHaveBeenCalledTimes(1);
  });

  it("handles Case2: Alice has FC linked ✅, requests $ from anyone", async () => {
    // Action 2: Daimobot responses with link that requests $ from anyone to Alice's Daimo address
    mockTrpcClient.lookupEthereumAccountByFid.query = jest
      .fn()
      .mockResolvedValue({
        address: validAddress,
      });

    mockTrpcClient.createRequestSponsored.mutate = jest
      .fn()
      .mockResolvedValue(validAddress);

    const processor = new DaimobotProcessor(
      mockEvent,
      mockTrpcClient,
      mockNeynarClient
    );

    await processor.process();

    expect(mockNeynarClient.publishCast).toHaveBeenCalledWith(
      expect.any(String),
      REQUEST_PAYMENT_MESSAGE(amount, senderUsername),
      expect.anything()
    );
    expect(mockNeynarClient.publishCast).toHaveBeenCalledTimes(1);

    expect(mockTrpcClient.createRequestSponsored.mutate).toHaveBeenCalledTimes(
      1
    );
    expect(mockTrpcClient.createRequestSponsored.mutate).not.toThrow();
  });

  it("handles Case 3: Alice responds to Bobs post to pay him, Bob doesn't have FC linked ❌", async () => {
    // Action 3: Daimobot responds with a link to register with Farcaster. Bob registers, then Daimobot responds with a link to request $

    const bob = {
      username: "bob",
      fid: 456,
    };
    mockNeynarClient.fetchBulkUsers = jest
      .fn()
      .mockResolvedValue({ users: [{ username: bob.username }] });

    const processor = new DaimobotProcessor(
      {
        data: {
          ...mockEvent.data,
          text: `@daimobot pay $${amount}`,
          parent_author: { fid: bob.fid },
        },
      },
      mockTrpcClient,
      mockNeynarClient
    );

    await processor.process();

    // Without FC linked, Daimobot should request parent-thread user to connect their FC
    expect(mockNeynarClient.publishCast).toHaveBeenCalledWith(
      expect.any(String),
      PAYMENT_CONNECT_FC_MESSAGE("bob"),
      expect.anything()
    );
    expect(mockNeynarClient.publishCast).toHaveBeenCalledTimes(1);

    expect(mockNeynarClient.fetchBulkUsers).toHaveBeenCalledWith([bob.fid]);
  });

  it("handles Case 4: Alice responds to Bobs post to pay him, Bob has FC linked ✅", async () => {
    // Action 4: Daimobot responds with link that requests $ from anyone to Bob's Daimo address
    const bob = {
      username: "bob",
      fid: 456,
    };
    mockNeynarClient.fetchBulkUsers = jest
      .fn()
      .mockResolvedValue({ users: [{ username: bob.username }] });

    mockTrpcClient.lookupEthereumAccountByFid.query = jest
      .fn()
      .mockResolvedValue({
        address: validAddress,
      });

    mockTrpcClient.createRequestSponsored.mutate = jest
      .fn()
      .mockResolvedValue(validAddress);

    const processor = new DaimobotProcessor(
      {
        data: {
          ...mockEvent.data,
          text: `@daimobot pay $${amount}`,
          parent_author: { fid: bob.fid },
        },
      },
      mockTrpcClient,
      mockNeynarClient
    );

    await processor.process();

    expect(mockNeynarClient.publishCast).toHaveBeenCalledWith(
      expect.any(String),
      REQUEST_PAYMENT_MESSAGE(amount, bob.username),
      expect.anything()
    );
    expect(mockNeynarClient.publishCast).toHaveBeenCalledTimes(1);

    expect(mockTrpcClient.createRequestSponsored.mutate).toHaveBeenCalledTimes(
      1
    );
    expect(mockTrpcClient.createRequestSponsored.mutate).not.toThrow();
  });
});
