import { writable } from 'svelte/store'

export const selected = writable(0)
export const dragging = writable(false)
export const transform = writable({})
export const zoom = writable(1)
export const library = writable( true )