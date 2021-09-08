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
	],
	layouts: {
		'Single Print': [1,1],
		'Test Print (2x2)': [2,2],
		'Test Print (2x3)': [2,3],
		'Test Print (3x3)': [3,3],
		'Test Print (3x4)': [3,4],
		'Test Print (4x4)': [4,4]
	}
}
