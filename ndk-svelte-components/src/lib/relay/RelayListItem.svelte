<script lang="ts">
import { type NDKRelay, NDKRelayStatus } from "@nostr-dev-kit/ndk";
import { onMount } from "svelte";
import RelayName from "./RelayName.svelte";

export let relay: NDKRelay;
export const expanded = false;

let notices: string[] = [];
let _activeSubCount = relay.activeSubscriptions().size;

onMount(() => {
    relay.on("notice", (_, notice) => {
        notices = [notice, ...notices];
    });
});

$: _activeSubCount = relay.activeSubscriptions().size;
setInterval(() => {
    _activeSubCount = relay.activeSubscriptions().size;
}, 1000);

let _nextReconnectIn: number | undefined;
let nextReconnectInterval: any;

setInterval(() => {
    if (!relay.connectionStats.nextReconnectAt || relay.connectionStats.nextReconnectAt! < Date.now()) {
        clearInterval(nextReconnectInterval);
        _nextReconnectIn = undefined;
        return;
    }

    _nextReconnectIn = Math.floor((relay.connectionStats.nextReconnectAt - Date.now()) / 1000);
}, 1000);
</script>

<li>
    <button
        class="relay-button"
        on:click={() => expanded = !expanded}
    >
        {#if relay.status === NDKRelayStatus.CONNECTING || relay.status === NDKRelayStatus.RECONNECTING}
            <span class="relay-status relay-status--connecting" />
        {:else if relay.status === NDKRelayStatus.DISCONNECTED}
            <span class="relay-status relay-status--disconnected" />
        {:else if relay.status === NDKRelayStatus.CONNECTED}
            <span class="relay-status relay-status--connected" />
        {:else if relay.status === NDKRelayStatus.FLAPPING}
            <span class="relay-status relay-status--flapping" />
        {:else if relay.status === NDKRelayStatus.AUTHENTICATING}
            <span class="relay-status relay-status--authenticating" />
        {/if}
        <span class="relay-name"><RelayName {relay} /></span>
        {#if activeSubCount > 0}
            <div class="relay-subscriptions">
                {activeSubCount}
                {activeSubCount === 1 ? 'subscription' : 'subscriptions'}
            </div>
        {/if}
    </button>

    {#if relay.connectionStats.attempts > 1 && relay.status !== NDKRelayStatus.CONNECTED}
        <div class="relay-connectivity-info">
            <span>
                Reconnection attempts: {relay.connectionStats.attempts}
            </span>

            {#if nextReconnectIn}
                <span>
                    Next reconnect in
                    {nextReconnectIn} seconds
                </span>
            {/if}
        </div>
    {/if}

    {#if notices.length > 0}
        <ul>
            {#each notices as notice, i (i)}
                <li class="relay-notice">{notice}</li>
            {/each}
        </ul>
    {/if}

    {#if expanded}
        <ul>
            {#key activeSubCount}
                {#each relay.activeSubscriptions().entries() as [filters, subscriptions]}
                    <li>
                        <div class="relay-subscription-filter">
                            {JSON.stringify(filters)}
                        </div>
                        <span class="relay-subscription--event-count">
                            {#if subscriptions.length > 1}
                                {subscriptions.length} subscriptions grouped
                                {#each subscriptions as sub}
                                    {#if sub.subId}
                                        <code>{sub.subId} </code>
                                    {/if}
                                {/each}
                            {:else if subscriptions.length === 1 && subscriptions[0].subId}
                                <code>{subscriptions[0].subId}</code>
                            {/if}
                        </span>
                    </li>
                {/each}
            {/key}
        </ul>
    {/if}
</li>


<style>
    .relay-name {
        font-weight: 400;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .relay-button {
        background: none;
        border: none;
        padding: 0;
        font: inherit;
        cursor: pointer;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 4px;
        width: 100%;
    }

    .relay-notice {
        font-size: 0.8em;
        font-weight: 300;
        background-color: #e74c3c88;
        padding: 5px;
        border-radius: 5px;
    }

    .relay-status {
        flex-shrink: 0;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-left: 5px;
    }

    .relay-status--connecting {
        background-color: #f1c40f;
    }

    .relay-button--authenticating {
        background-color: #aa4240;
    }

    .relay-status--disconnected {
        background-color: #e74c3c;
    }

    .relay-status--connected {
        background-color: #2ecc71;
    }

    .relay-status--flapping {
        background-color: #3498db;
    }

    .relay-status--flapping::after {
        content: 'flapping';
        color: white;
        font-weight: 500;
        font-size: 0.6em;
    }

    .relay-subscriptions {
        margin-left: 5px;
        float: right;
        font-size: 0.8em;
        font-weight: 300;
        cursor: pointer;
    }

    .relay-subscription-filter {
        font-size: 0.9em;
        font-weight: 300;
        font-family: monospace;
        padding: 5px;
        background-color: white;
        color: #111111;
        border-radius: 5px;
        border: 1px solid #e1e1e1;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
        margin-top: 5px;
        overflow: auto;
    }

    .relay-subscription--event-count {
        font-size: 0.8em;
        font-weight: 300;
        margin-left: 5px;
    }

    .relay-connectivity-info {
        font-size: 0.8em;
        font-weight: 300;
        margin-top: 5px;
    }
</style>
