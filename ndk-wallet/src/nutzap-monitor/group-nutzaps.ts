import { type NDKNutzap, cashuPubkeyToNostrPubkey, proofP2pk } from "@nostr-dev-kit/ndk";
import type { NDKNutzapMonitor } from ".";

export type GroupedNutzaps = {
    mint: string;
    cashuPubkey: string;
    nostrPubkey: string;
    nutzaps: NDKNutzap[];
};

export function groupNutzaps(nutzaps: NDKNutzap[], monitor: NDKNutzapMonitor): GroupedNutzaps[] {
    const result = new Map<string, GroupedNutzaps>();
    const getKey = (mint: string, p2pk = "no-key") => `${mint}:${p2pk}`;

    for (const nutzap of nutzaps) {
        if (!monitor.shouldTryRedeem(nutzap)) continue;

        const mint = nutzap.mint;

        for (const proof of nutzap.proofs) {
            const cashuPubkey = proofP2pk(proof) ?? "no-key";

            // add to the right group
            const key = getKey(mint, cashuPubkey);
            const group = (result.get(key) ?? {
                mint,
                cashuPubkey,
                nostrPubkey: cashuPubkeyToNostrPubkey(cashuPubkey),
                nutzaps: [],
            }) as GroupedNutzaps;
            group.nutzaps.push(nutzap);
            result.set(key, group);
        }
    }

    return Array.from(result.values());
}
