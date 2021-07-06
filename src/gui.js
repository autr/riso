const config = [
	{
		name: 'invert',
		type: 'bool',
		default: 0,
		label: 'Invert'
	},
	{
		name: 'hue_point',
		type: 'float',
		default: 0,
		label: 'Hue',
		link: 'picker'
	},
	{
		name: 'hue_width',
		type: 'float',
		default: 0.1,
		label: 'Width',
		link: 'picker'
	},
	{
		name: 'hue_falloff',
		type: 'float',
		default: 0.5,
		label: 'Falloff',
		link: 'picker'
	},
	{
		name: 'levels_low',
		type: 'float',
		default: 0,
		label: 'Levels'
	},
	{
		name: 'levels_mid',
		type: 'float',
		default: 0.5,
		label: false
	},
	{
		name: 'levels_high',
		type: 'float',
		default: 1,
		label: false
	},
	{
		name: 'opacity',
		type: 'float',
		default: 1,
		label: 'Opacity'
	}
]


const header = config.map( g => {
	return `uniform ${g.type} ${g.name};`
}).join('\n') + (`
uniform int colour;
uniform int type;
`)

export default { config, header }