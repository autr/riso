<script>

	import * as PIXI from 'pixi.js'
	import { onMount } from 'svelte'
	import gui from './_gui.js'
	import glLib from './_gl.js'
	import colours_raw from './_colours.js'
	import { trigger } from './_stores.js'

	export let layer
	export let target
	export let vertical = false

	let colours = colours_raw()

	$: COLOR = colours?.[layer.colour]

	let el
	onMount( setup )

	$: setup( target )

	async function setup( t ) {

		console.log(`[Palette] 🎨  running setup...`)
		// if (!target) return
		let config = {
			width: vertical ? 1 : 360, 
			height: vertical ? 360 : 1,
			antialias: false,
			transparent: true,
			resolution: 1,
			forceCanvas: true
		}
		let app = new PIXI.Application(config)
		let graphic = new PIXI.Graphics()
		graphic.beginFill( 0x000000, 0 )
		graphic.drawRect(0, 0, config.width, config.height)

		const fragment = window.palette = `
${glLib}
${gui.header}
varying vec2 vTextureCoord;
uniform sampler2D uSampler;




vec4 extract() {

	float width = hue_width * 0.5;
	float falloff = ( ( 1.0 - hue_width ) / 2.0 ) * hue_falloff;
	float low = hue_point - width;
	float high = hue_point + width;
	float very_low = low - falloff;
	float very_high = high + falloff;


	float hue = map( vTextureCoord.${vertical ? 'y' : 'x'}, 0.0, 1.0, very_low, very_high);
	float alpha = 1.0;

	if ( within( hue, very_low, low ) != 0 ) {
		alpha = map( hue, very_low, low, 0.0, 1.0 );
	}
	if ( within( hue, high, very_high ) != 0 ) {
		alpha = map( hue, high, very_high, 1.0, 0.0 );
	}

	vec3 hsv = vec3( hue, 1.0, 1.0 );
	vec3 rgb =  hsv2rgb( hsv );
	vec3 bg = hsv2rgb( vec3( 200.0 / 360.0, 0.01, 0.9 ) );
	vec4 final = vec4(rgb,1.0);
	vec4 original = texture2D(uSampler, vTextureCoord);
	return (final * alpha) + (texture2D(uSampler, vTextureCoord) * (1.0 - alpha));

}

void main(void) {

	if (type == 0) {
		gl_FragColor = extract();
	} else {

		if (type == 1) gl_FragColor = vec4(0.0,1.0,1.0,1.0);
		if (type == 2) gl_FragColor = vec4(1.0,0.0,1.0,1.0);
		if (type == 3) gl_FragColor = vec4(1.0,1.0,0.0,1.0);
		if (type == 4) gl_FragColor = vec4(0.0);
		if (type == 5) gl_FragColor = vec4(1.0,0.0,0.0,1.0);
		if (type == 6) gl_FragColor = vec4(0.0,1.0,0.0,1.0);
		if (type == 7) gl_FragColor = vec4(0.0,0.0,1.0,1.0);
	}


}`
		// console.log('[Palette] setup')

		graphic.filters = [new PIXI.Filter(null, fragment, layer)]
		app.stage.addChild(graphic)
		if (el) el.appendChild(app.view)

	}

	// $: ( async _trigger => {

	// 	if ($trigger.palettes) {
	// 		await setup()
	// 		$trigger.palettes = false
	// 	}
	// })($trigger)

	
</script>
<div class="palette-ink rel basis0pc flex grow palette" style={`background-color: rgb(${COLOR?.rgb})`} />
<div class="palette-range rel basis0pc flex grow palette br1-solid"  bind:this={el} />