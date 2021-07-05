export default {
	neu: (x, y, width, height) => ({x,y,width,height}),
	shrinkBy: (r, px) => {
		if (!px) return r
		r.x += px
		r.y += px
		r.width += px * -2
		r.height += px * -2
		return r
	},
	fitInto: (a, b, offset) => {
		let ra = a.width / a.height
		let rb = b.width / b.height
		if (!offset) offset = 0.5

		console.log(ra, rb)

		let width = ra > rb ? b.width : a.width * (b.height / a.height)
		let height = ra > rb ? a.height * (b.width / a.width) : b.height
		let x = b.x + ( ra > rb ? 0 : (b.width - width) * offset)
		let y = b.y + ( ra > rb ? (b.height - height) * offset : 0)

		return { x, y, width, height }
	},
	auto: (r, obj) => {
		obj.x = r.x
		obj.y = r.y
		obj.width = r.width
		obj.height = r.height
	}
}