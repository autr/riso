import { detect } from 'detect-browser'
import { writable,readable } from 'svelte/store'

let neutralino = false
try {
	if (Neutralino) {
		neutralino = true
		console.log('[stores] ⚛️  neutralino is set')
	}
} catch(err) {}

let _browser = { ...detect(), brave: navigator.brave, neutralino }
let compatible = ['chrome','edge','opera']
let ok = compatible.indexOf(_browser.name) != -1 || neutralino
let brave = (_browser.name == 'chrome' && _browser.brave)

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
export const original = writable( false )
export const warning = writable( false ) 
export const incompatible = readable( !ok || brave )
export const electron = readable( navigator.userAgent.toLowerCase().indexOf('electron') != -1 )
export const browser = readable( _browser )
export const permissions = writable( {} )
export const requests = writable( [] )