<script lang="ts">
import type { UrlFactory, UrlType } from "$lib";
import type NDK from "@nostr-dev-kit/ndk";
import { type NDKEvent, NDKKind, NDKList } from "@nostr-dev-kit/ndk";
import { NDKArticle } from "@nostr-dev-kit/ndk";
import type { MarkedExtension } from "marked";
import type { ComponentType } from "svelte";
import Kind1 from "./Kind1.svelte";
// import Kind40 from "./Kind40.svelte"
import Kind1063 from "./Kind1063.svelte";
// import Kind1985 from "./Kind1985.svelte"
import Kind9802 from "./Kind9802.svelte";
import Kind30000 from "./Kind30000.svelte";
import Kind30001 from "./Kind30001.svelte";
import Kind30023 from "./Kind30023.svelte";

export let ndk: NDK;
export let event: NDKEvent | null | undefined;
export const anchorId: string | null = null;
export const maxLength = 700;
export const showEntire = true;
export const showMedia = true;
export const mediaCollectionComponent: ComponentType | undefined = undefined;
export const eventCardComponent: ComponentType | undefined = undefined;

export const urlFactory: UrlFactory = (type: UrlType, value: string) => {
    switch (type) {
        case "hashtag":
            return `/t/${value}`;
        case "mention":
            return `/p/${value}`;
        default:
            return value;
    }
};

/**
 * Markdown marked extensions to use
 */
export const markedExtensions: MarkedExtension[] = [];

/**
 * Optional content to use instead of the one from the event
 */
export const content = event?.content;

const _markdownKinds = [NDKKind.Article, 30041];
</script>

{#if event}
    {#if event.kind === 1}
        <Kind1 {urlFactory} {ndk} {content} {event} {anchorId} {maxLength} {showEntire} {showMedia} on:click class={$$props.class} {mediaCollectionComponent} {eventCardComponent} />
    {:else if event.kind === 40}
        <!-- <Kind40 {event} /> -->
    {:else if event.kind === 1063}
        <Kind1063 {event} {showMedia} class={$$props.class} />
    {:else if event.kind === 1985}
        <!-- <Kind1985 {event} {anchorId} {maxLength} {showEntire} /> -->
    {:else if event.kind === 9802}
        <Kind9802 {event} class={$$props.class} />
    {:else if event.kind === 30000}
        <Kind30000 {ndk} list={NDKList.from(event)} class={$$props.class} />
    {:else if event.kind === 30001}
        <Kind30001 {ndk} list={NDKList.from(event)} class={$$props.class} />
    {:else if markdownKinds.includes(event.kind)}
        <Kind30023
            {ndk}
            {content}
            {...$$props}
            article={NDKArticle.from(event)}
            {showMedia}
            on:click
            class={$$props.class}
            {urlFactory}
            {eventCardComponent}
            {markedExtensions}
        />
    {:else}
        <Kind1
            {ndk}
            {content}
            {event}
            {anchorId}
            {showMedia}
            on:click
            class={$$props.class}
            {maxLength}
            {showEntire}
            {mediaCollectionComponent}
            {eventCardComponent}
            {urlFactory}
        />
    {/if}
{/if}
