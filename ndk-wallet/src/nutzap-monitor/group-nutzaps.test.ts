import { type NDKNutzap, cashuPubkeyToNostrPubkey } from "@nostr-dev-kit/ndk";
import { describe, expect, test, vi } from "vitest";
import { GroupedNutzaps, groupNutzaps } from "./group-nutzaps";
import { type NDKNutzapMonitor, NdkNutzapStatus } from "./index";

describe("groupNutzaps", () => {
    // Mock the NDKNutzapMonitor with a simple implementation of shouldTryRedeem
    const createMockMonitor = (shouldTryRedeemResult = true) => {
        return {
            shouldTryRedeem: vi.fn().mockImplementation(() => shouldTryRedeemResult),
        } as unknown as NDKNutzapMonitor;
    };

    // Helper to create a mock NDKNutzap
    const createMockNutzap = (id: string, mint: string, proofs: any[]) => {
        return {
            id,
            mint,
            proofs,
        } as unknown as NDKNutzap;
    };

    test("should group nutzaps by mint and p2pk", () => {
        // Create mock monitor
        const monitor = createMockMonitor();

        // Create mock nutzaps with different mints and p2pk values
        const nutzaps = [
            createMockNutzap("id1", "mint1", [{ secret: JSON.stringify(["P2PK", { data: "02pubkey1" }]) }]),
            createMockNutzap("id2", "mint1", [{ secret: JSON.stringify(["P2PK", { data: "02pubkey1" }]) }]),
            createMockNutzap("id3", "mint1", [{ secret: JSON.stringify(["P2PK", { data: "02pubkey2" }]) }]),
            createMockNutzap("id4", "mint2", [{ secret: JSON.stringify(["P2PK", { data: "02pubkey1" }]) }]),
        ];

        // Call the function under test
        const result = groupNutzaps(nutzaps, monitor);

        // Verify monitor.shouldTryRedeem was called for each nutzap
        expect(monitor.shouldTryRedeem).toHaveBeenCalledTimes(4);

        // Verify the result
        expect(result.length).toBe(3);

        // Verify groups are correctly formed
        const group1 = result.find((g) => g.mint === "mint1" && g.cashuPubkey === "02pubkey1");
        const group2 = result.find((g) => g.mint === "mint1" && g.cashuPubkey === "02pubkey2");
        const group3 = result.find((g) => g.mint === "mint2" && g.cashuPubkey === "02pubkey1");

        expect(group1).toBeDefined();
        expect(group2).toBeDefined();
        expect(group3).toBeDefined();

        // Check that nostrPubkey is correctly set
        expect(group1?.nostrPubkey).toBe(cashuPubkeyToNostrPubkey("02pubkey1"));
        expect(group2?.nostrPubkey).toBe(cashuPubkeyToNostrPubkey("02pubkey2"));
        expect(group3?.nostrPubkey).toBe(cashuPubkeyToNostrPubkey("02pubkey1"));

        expect(group1?.nutzaps.length).toBe(2);
        expect(group2?.nutzaps.length).toBe(1);
        expect(group3?.nutzaps.length).toBe(1);

        expect(group1?.nutzaps.map((n) => n.id)).toContain("id1");
        expect(group1?.nutzaps.map((n) => n.id)).toContain("id2");
        expect(group2?.nutzaps.map((n) => n.id)).toContain("id3");
        expect(group3?.nutzaps.map((n) => n.id)).toContain("id4");
    });

    test("should filter nutzaps that should not be redeemed", () => {
        // Create a mock monitor where shouldTryRedeem returns false for specific nutzap ids
        const monitor = {
            shouldTryRedeem: vi.fn().mockImplementation((nutzap) => nutzap.id !== "id2" && nutzap.id !== "id4"),
        } as unknown as NDKNutzapMonitor;

        // Create mock nutzaps
        const nutzaps = [
            createMockNutzap("id1", "mint1", [{ secret: JSON.stringify(["P2PK", { data: "02pubkey1" }]) }]),
            createMockNutzap("id2", "mint1", [{ secret: JSON.stringify(["P2PK", { data: "02pubkey1" }]) }]),
            createMockNutzap("id3", "mint2", [{ secret: JSON.stringify(["P2PK", { data: "02pubkey1" }]) }]),
            createMockNutzap("id4", "mint2", [{ secret: JSON.stringify(["P2PK", { data: "02pubkey1" }]) }]),
        ];

        // Call the function under test
        const result = groupNutzaps(nutzaps, monitor);

        // Verify monitor.shouldTryRedeem was called for each nutzap
        expect(monitor.shouldTryRedeem).toHaveBeenCalledTimes(4);

        // Verify the result only contains the nutzaps that should be redeemed
        expect(result.length).toBe(2);

        // Check that nostrPubkey is correctly set
        result.forEach((group) => {
            expect(group.nostrPubkey).toBe(cashuPubkeyToNostrPubkey(group.cashuPubkey));
        });

        const ids = result.flatMap((g) => g.nutzaps.map((n) => n.id));
        expect(ids).toContain("id1");
        expect(ids).toContain("id3");
        expect(ids).not.toContain("id2");
        expect(ids).not.toContain("id4");
    });

    test("should handle nutzaps with no p2pk properly", () => {
        const monitor = createMockMonitor();

        // Create mock nutzaps with invalid/missing p2pk
        const nutzaps = [
            createMockNutzap("id1", "mint1", [{ secret: "invalid-json" }]),
            createMockNutzap("id2", "mint1", [
                { secret: JSON.stringify({}) }, // Missing P2PK structure
            ]),
            createMockNutzap("id3", "mint1", [{ secret: JSON.stringify(["P2PK", { data: "02pubkey1" }]) }]),
        ];

        // Call the function under test
        const result = groupNutzaps(nutzaps, monitor);

        // Verify monitor.shouldTryRedeem was called for each nutzap
        expect(monitor.shouldTryRedeem).toHaveBeenCalledTimes(3);

        // Verify the result
        expect(result.length).toBe(2);

        // Group for nutzaps with no-key
        const noKeyGroup = result.find((g) => g.mint === "mint1" && g.cashuPubkey === "no-key");
        expect(noKeyGroup).toBeDefined();
        expect(noKeyGroup?.nutzaps.length).toBe(2);
        expect(noKeyGroup?.nostrPubkey).toBe(cashuPubkeyToNostrPubkey("no-key"));

        // Group for nutzaps with valid key
        const validKeyGroup = result.find((g) => g.mint === "mint1" && g.cashuPubkey === "02pubkey1");
        expect(validKeyGroup).toBeDefined();
        expect(validKeyGroup?.nutzaps.length).toBe(1);
        expect(validKeyGroup?.nostrPubkey).toBe(cashuPubkeyToNostrPubkey("02pubkey1"));
    });

    test("should handle multiple proofs in a single nutzap", () => {
        const monitor = createMockMonitor();

        // Create mock nutzap with multiple proofs
        const nutzap = createMockNutzap("id1", "mint1", [
            {
                secret: JSON.stringify(["P2PK", { data: "02pubkey1" }]),
                amount: 100,
            },
            {
                secret: JSON.stringify(["P2PK", { data: "02pubkey2" }]),
                amount: 200,
            },
        ]);

        // Call the function under test
        const result = groupNutzaps([nutzap], monitor);

        // Verify that the nutzap is grouped into two separate groups
        expect(result.length).toBe(2);

        const group1 = result.find((g) => g.mint === "mint1" && g.cashuPubkey === "02pubkey1");
        const group2 = result.find((g) => g.mint === "mint1" && g.cashuPubkey === "02pubkey2");

        expect(group1).toBeDefined();
        expect(group2).toBeDefined();

        // Check nostrPubkey is correctly set
        expect(group1?.nostrPubkey).toBe(cashuPubkeyToNostrPubkey("02pubkey1"));
        expect(group2?.nostrPubkey).toBe(cashuPubkeyToNostrPubkey("02pubkey2"));

        expect(group1?.nutzaps.length).toBe(1);
        expect(group2?.nutzaps.length).toBe(1);

        // The same nutzap should be in both groups
        expect(group1?.nutzaps[0].id).toBe("id1");
        expect(group2?.nutzaps[0].id).toBe("id1");
    });

    test("should place nutzaps with different pubkey formats in different groups", () => {
        const monitor = createMockMonitor();

        // Create mock nutzaps with the specific pubkey formats mentioned
        const nutzaps = [
            createMockNutzap("id1", "mint1", [
                {
                    secret: JSON.stringify([
                        "P2PK",
                        {
                            data: "02fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52",
                        },
                    ]),
                },
            ]),
            createMockNutzap("id2", "mint1", [
                {
                    secret: JSON.stringify([
                        "P2PK",
                        {
                            data: "fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52",
                        },
                    ]),
                },
            ]),
        ];

        // Call the function under test
        const result = groupNutzaps(nutzaps, monitor);

        // Verify the result
        expect(result.length).toBe(2);

        // Find each group
        const group1 = result.find(
            (g) => g.cashuPubkey === "02fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52",
        );
        const group2 = result.find(
            (g) => g.cashuPubkey === "fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52",
        );

        expect(group1).toBeDefined();
        expect(group2).toBeDefined();

        // Each group should have one nutzap
        expect(group1?.nutzaps.length).toBe(1);
        expect(group2?.nutzaps.length).toBe(1);

        // Check the mapping is correct
        expect(group1?.nutzaps[0].id).toBe("id1");
        expect(group2?.nutzaps[0].id).toBe("id2");
    });

    test("should handle empty nutzap array", () => {
        const monitor = createMockMonitor();

        // Call the function under test with an empty array
        const result = groupNutzaps([], monitor);

        // Verify the result is an empty array
        expect(result).toEqual([]);
    });

    test("should handle complex scenario with multiple mints, pubkeys and redeemable states", () => {
        // Create a mock monitor with variable shouldTryRedeem behavior
        const monitor = {
            shouldTryRedeem: vi.fn().mockImplementation((nutzap) => {
                // Only allow nutzaps with id1, id3, id5
                return ["id1", "id3", "id5"].includes(nutzap.id);
            }),
        } as unknown as NDKNutzapMonitor;

        // Create a complex set of nutzaps
        const nutzaps = [
            // Mint1, pubkey1 - should be redeemed
            createMockNutzap("id1", "mint1", [{ secret: JSON.stringify(["P2PK", { data: "02pubkey1" }]) }]),
            // Mint1, pubkey1 - should NOT be redeemed
            createMockNutzap("id2", "mint1", [{ secret: JSON.stringify(["P2PK", { data: "02pubkey1" }]) }]),
            // Mint1, pubkey2 - should be redeemed
            createMockNutzap("id3", "mint1", [{ secret: JSON.stringify(["P2PK", { data: "02pubkey2" }]) }]),
            // Mint2, pubkey1 - should NOT be redeemed
            createMockNutzap("id4", "mint2", [{ secret: JSON.stringify(["P2PK", { data: "02pubkey1" }]) }]),
            // Mint2, pubkey2 - should be redeemed
            createMockNutzap("id5", "mint2", [{ secret: JSON.stringify(["P2PK", { data: "02pubkey2" }]) }]),
        ];

        // Call the function under test
        const result = groupNutzaps(nutzaps, monitor);

        // Verify filter behavior - only redeemable nutzaps should be included
        expect(monitor.shouldTryRedeem).toHaveBeenCalledTimes(5);

        // Since we're filtering, we should have 3 nutzaps in 3 different groups
        expect(result.length).toBe(3);

        // Expected groups:
        // 1. mint1, pubkey1 (id1)
        // 2. mint1, pubkey2 (id3)
        // 3. mint2, pubkey2 (id5)
        const group1 = result.find((g) => g.mint === "mint1" && g.cashuPubkey === "02pubkey1");
        const group2 = result.find((g) => g.mint === "mint1" && g.cashuPubkey === "02pubkey2");
        const group3 = result.find((g) => g.mint === "mint2" && g.cashuPubkey === "02pubkey2");

        expect(group1).toBeDefined();
        expect(group2).toBeDefined();
        expect(group3).toBeDefined();

        // Each group should have exactly one nutzap
        expect(group1?.nutzaps.length).toBe(1);
        expect(group2?.nutzaps.length).toBe(1);
        expect(group3?.nutzaps.length).toBe(1);

        // Check that each group has the correct nutzap
        expect(group1?.nutzaps[0].id).toBe("id1");
        expect(group2?.nutzaps[0].id).toBe("id3");
        expect(group3?.nutzaps[0].id).toBe("id5");
    });

    test("should assign nostrPubkey for cashu pubkeys", () => {
        const monitor = createMockMonitor();

        // Mock cashu pubkeys
        const cashuPubkeys = ["02fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52", "no-key"];

        // Create nutzaps with these pubkeys
        const nutzaps = cashuPubkeys.map((pubkey, index) =>
            createMockNutzap(`id${index + 1}`, "mint1", [
                {
                    secret: pubkey === "no-key" ? "invalid-secret" : JSON.stringify(["P2PK", { data: pubkey }]),
                },
            ]),
        );

        // Call the function under test
        const result = groupNutzaps(nutzaps, monitor);

        // Verify that the nostrPubkey field is correctly set for each group
        result.forEach((group) => {
            expect(group.nostrPubkey).toBe(cashuPubkeyToNostrPubkey(group.cashuPubkey));
        });
    });

    test("should handle nutzaps with no valid proofs", () => {
        const monitor = createMockMonitor();

        // Create a nutzap with no valid proofs
        const nutzap = createMockNutzap("id1", "mint1", [{ secret: "invalid-json-1" }, { secret: "invalid-json-2" }]);

        // Call the function under test
        const result = groupNutzaps([nutzap], monitor);

        // Verify we get one group with a "no-key" cashuPubkey
        expect(result.length).toBe(1);
        expect(result[0].mint).toBe("mint1");
        expect(result[0].cashuPubkey).toBe("no-key");
        expect(result[0].nostrPubkey).toBe(cashuPubkeyToNostrPubkey("no-key"));
        expect(result[0].nutzaps.length).toBe(2);
        expect(result[0].nutzaps[0].id).toBe("id1");
    });
});
