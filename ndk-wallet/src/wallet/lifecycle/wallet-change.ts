import { NDKEvent } from "@nostr-dev-kit/ndk";
import { NDKWalletChange } from "../../cashu/history";
import NDKWalletLifecycle from ".";

async function handleWalletChange(
    this: NDKWalletLifecycle,
    event: NDKEvent
) {
    const walletChange = await NDKWalletChange.from(event);

    if (walletChange.hasNutzapRedemption) {
        this.addNutzapRedemption(walletChange);
    }
}

export default handleWalletChange;