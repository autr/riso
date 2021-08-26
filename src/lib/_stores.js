import { writable } from 'svelte/store'

export const selected = writable(0)
export const antilag = writable(false)