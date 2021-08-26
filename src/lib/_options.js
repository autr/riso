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
		gen.size( 'DIN A4', 210, 297 ),
		gen.size( 'DIN A3', 297, 420 ),
		gen.size( 'DIN A2', 420, 594 )
	]
}
