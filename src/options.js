import colorString from 'color-string'

const gen = {
	bg: (name, colour, grain) => ({
		name,
		colour: colorString.get.hsl(colour),
		grain
	}),
	size: (name, width, height) => ({
		name,
		xy: [width,height]
	})
}

export default {
	backgrounds: [
		gen.bg( 'Ultra black', `hsl(0, 0%, 5%)`, 0.5),
		gen.bg( 'Blue black', `hsl(200, 60%, 10%)`, 0.5),
		gen.bg( 'Bone white', `hsl(0, 0%, 98%)`, 0.1),
		gen.bg( 'Warm white', `hsl(50, 90%, 97%)`, 0.1)
	],
	sizes: [
		gen.size( 'A4 (landscape)', 297, 210 ),
		gen.size( 'A4 (portrait)', 210, 297 ),
		gen.size( 'A3 (landscape)', 420, 297 ),
		gen.size( 'A3 (portrait)', 297, 420 ),
		gen.size( 'A2 (landscape)', 594, 420 ),
		gen.size( 'A2 (portrait)', 420, 594 )
	]
}
