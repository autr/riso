import { get, set } from 'idb-keyval'

function init() {

	let o = { get: {}, set: {} }
	let stores = ['files','projects','ignore']

	for (let n of stores) {
		let k = 'RISO_' + n.toUpperCase()
		console.log(`[DB] 🐡  creating get / set for ${k}`)
		o.get[n] = async a => (await get( k ))
		o.set[n] = async a => (await set( k, a ))
	}

	return o
}


export default init()