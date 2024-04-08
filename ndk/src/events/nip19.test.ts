import "websocket-polyfill";

import type { NostrEvent } from "./index.js";
import { NDKEvent } from "./index.js";
import { NDK } from "../ndk/index.js";
import { NDKRelay } from "../relay/index.js";

let ndk: NDK;

beforeAll(() => {
    ndk = new NDK();
});

describe("NDKEvent", () => {
    describe("encode", () => {
        it("encodes NIP-33 events", () => {
            const event = new NDKEvent(ndk, {
                kind: 30000,
                pubkey: "fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52",
                tags: [["d", "1234"]],
            } as NostrEvent);

            const a = event.encode();
            expect(a).toBe(
                "naddr1qvzqqqr4xqpzp75cf0tahv5z7plpdeaws7ex52nmnwgtwfr2g3m37r844evqrr6jqqzrzv3nxsl6m2ff"
            );
        });

        it("encodes NIP-33 events with relay when it's known", () => {
            const event = new NDKEvent(ndk, {
                kind: 30000,
                pubkey: "fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52",
                tags: [["d", "1234"]],
            } as NostrEvent);
            event.relay = new NDKRelay("wss://relay.f7z.io");

            const a = event.encode();
            expect(a).toBe(
                "naddr1qvzqqqr4xqpzp75cf0tahv5z7plpdeaws7ex52nmnwgtwfr2g3m37r844evqrr6jqyf8wumn8ghj7un9d3shjtnxxaazu6t0qqzrzv3nxsrcfx9f"
            );
        });

        it("encodes events as notes when the relay is known", () => {
            const event = new NDKEvent(ndk, {
                kind: 1,
                pubkey: "fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52",
                tags: [["d", "1234"]],
            } as NostrEvent);
            event.relay = new NDKRelay("wss://relay.f7z.io");

            const a = event.encode();
            expect(a).toBe(
                "nevent1qgs04xzt6ldm9qhs0ctw0t58kf4z57umjzmjg6jywu0seadwtqqc75spzfmhxue69uhhyetvv9ujue3h0ghxjmcqqqwvqq2y"
            );
        });
    });
});
