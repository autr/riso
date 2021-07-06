<script>

	import * as PIXI from 'pixi.js'
	import { onMount } from 'svelte'
	import gui from './gui.js'
	import lib from './lib.js'
	import colours from './colours.js'

	export let layer
	export let target
	export let vertical = false

	let el
	onMount( setup )

	$: setup( target )

	async function setup( t ) {

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
		// graphic.beginFill( 0x000000 )
		graphic.drawRect(0, 0, config.width, config.height)

		const fragment = window.palette = `
${lib}
${gui.header}
varying vec2 vTextureCoord;
uniform sampler2D uSampler;

vec4 extract() {

	float width = hue_width / 2.0;
	float falloff = hue_falloff / 2.0;
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
	vec3 final = ( rgb * alpha ) + ( bg * (1.0 - alpha) );
	return vec4( final, alpha);

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
		console.log('[Palette] setup')

		graphic.filters = [new PIXI.Filter(null, fragment, layer)]
		app.stage.addChild(graphic)
		if (el) el.appendChild(app.view)

	}
</script>
<div class="rel no-basis flex grow" bind:this={el} />
<div class="rel no-basis flex grow" style={`background-color: rgb(${colours?.[layer.colour]?.rgb})`} />