import { writable } from 'svelte/store'

export const selected = writable(0)
export const dragging = writable(false)
export const transform = writable({})
export const zoom = writable(1)
export const library = writable( false )
export const inited = writable( {} )
export const trigger = writable( {} )
export const moving = writable( null )
export const exporting = writable( false )
export const processing = writable( false )
export const solo = writable( null )