export default {
	neu: (x, y, width, height) => ({x,y,width,height}),
	create: (x, y, width, height) => ({x,y,width,height}),
	shrinkBy: (r, px) => {
		if (!px) return r
		r.x += px
		r.y += px
		r.width += px * -2
		r.height += px * -2
		return r
	},
	centerTo: (a, b) => {
		/*
			a = source rectangle {x,y,width,height}
			b = reference rectangle {x,y,width,height}
		*/

		a.x = b.x + (b.width/2)
		a.y = b.y + (b.height/2)
		a.x -= a.width/2
		a.y -= a.height/2

		return a
	},
	isInside: (x, y, r) => {
		return ( x > r.x && x < r.x + r.width && y > r.y && y < r.y + r.height)
	},
	fitInto: (a, b, offset, info) => {

		/*
			a = source rectangle {x,y,width,height}
			b = target rectangle {x,y,width,height}
			c = slide horz or vert (default=0.5)
		*/

		let ra = a.width / a.height
		let rb = b.width / b.height
		if (!offset) offset = 0.5
		let width = ra > rb ? b.width : a.width * (b.height / a.height)
		let height = ra > rb ? a.height * (b.width / a.width) : b.height

		if (info) console.log(`[rectd:fitInto]`, info, b.width, width, b.height, height)

		let x = b.x + (b.width - width) * offset
		let y = b.y + (b.height - height) * offset

		return { x, y, width, height }
	},
	autoSetObject: (from, to) => {

		/* automatically set properties from rectangle */

		if (!to) to = {}

		to.x = from.x || from.offsetLeft || 0
		to.y = from.y || from.offsetTop || 0
		to.width = from.width || from.offsetWidth || 0
		to.height = from.height || from.offsetHeight || 0
		return to
	},
	divideUp: (r, rows, columns) => {
		/*
			r = input rectangle {x,y,width,height}
			rows = int
			columns = int

			=> returns [{x,y,width,height}]
		*/

		let out = []
		let width = r.width / columns
		let height = r.height / rows

		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < columns; x++ ) {
				out.push({
					x: x * width,
					y: y * height,
					width,
					height
				})
			}
		}
		
		return out
	},
	splitUp: (r, count) => {
		const { x, y, width, height } = r
		let ratio = width/height
		let alt = ratio > 1
		let short = (alt ? width : height ) / count
		let out = []
		for (let i = 0; i < count; i++) out.push({
			x: alt ? short * i : 0,
			y: alt ? 0 : short * i,
			width: alt ? short : width,
			height: alt ? height : short,
		
		})
		return out

	}
}