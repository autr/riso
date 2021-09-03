const config = [
	{
		name: 'hue_point',
		type: 'float',
		default: 0,
		label: 'Hue',
		link: 0,
		viz: 360
	},
	{
		name: 'hue_width',
		type: 'float',
		default: 0.1,
		label: 'Width',
		link: 0,
		viz: 100
	},
	{
		name: 'hue_falloff',
		type: 'float',
		default: 0.5,
		label: 'Falloff',
		link: 0,
		viz: 100
	},
	{
		name: 'hue_balance',
		type: 'float',
		default: 0,
		label: 'Balance',
		link: 0,
		viz: 100
	},
	{
		name: 'invert',
		type: 'bool',
		default: 0,
		label: 'Invert',
		viz: null
	},
	{
		name: 'levels_low',
		type: 'float',
		default: 0,
		label: 'Levels',
		viz: 100
	},
	{
		name: 'levels_mid',
		type: 'float',
		default: 0.5,
		label: false,
		viz: 100
	},
	{
		name: 'levels_high',
		type: 'float',
		default: 1,
		label: false,
		viz: 100
	},
	{
		name: 'opacity',
		type: 'float',
		default: 1,
		label: 'Opacity',
		viz: 100
	}
]


const header = config.map( g => {
	return `uniform ${g.type} ${g.name};`
}).join('\n') + (`
uniform int colour;
uniform int type;
`)

export default { config, header }