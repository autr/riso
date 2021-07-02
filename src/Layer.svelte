<script>
	import lib from './lib.js'
	import colours from './colours.js'
	import * as PIXI from 'pixi.js'
	import {Sprite, getBlendFilter} from '@pixi/picture';
	import { onMount } from 'svelte'

	export let image
	export let stage
	export let mode
	export let uniforms = {}
	export let index = 0

	let sprite

	const slider = (value, min, max) => {
		return {value, min, max, type:'slider'}
	}

	const pair = (name, a, b, c, min, max ) => {
		return {
			[name + '_point']: slider(a,min,max),
			[name + '_width']: slider(b,min,max),
			[name + '_falloff']: slider(c,min,max),
		}
	}

	let ui = {
		hue: pair( 'hue', 0, 0.2, 0, 0, 1 ),
		levels: {
			levels_black: slider(0,0,1),
			levels_mid: slider(0.5,0,1),
			levels_white: slider(1,0,1),
			opacity: slider(1, 0, 1)
		}
		// saturation: pair( 'saturation', 0, 0, 0, 0, 1 ),
		// lightness: pair( 'lightness', 0, 0, 0, 0, 1 )
	}

	let colour = colours[ parseInt( Math.random() * (colours.length - 1) ) ]
	// let colour = colours.find( c => c.name == 'MINT') 

	$: ink = [
		parseFloat((colour?.rgb || '').split(',')[0]) / 255,
		parseFloat((colour?.rgb || '').split(',')[1]) / 255,
		parseFloat((colour?.rgb || '').split(',')[2]) / 255,
		1.0
	]

	function setUniforms( ui_ ) {
		let o = ({...ui.hue, ...ui.saturation, ...ui.lightness, ...ui.levels})
		Object.keys(o).forEach( k => {
			uniforms[k] = o[k].value
		})
		uniforms.ink = ink
		uniforms.invert = invert ? 1.0 : 0.0
		uniforms.type = type
	}

	$: setUniforms( ui, ink, invert, type )


	onMount( loaded )

	$: flattened = Object.keys(uniforms).map( k => {
			let type = (k == 'ink') ? 'vec4' : 'float'
			return `uniform ${type} ${k};`
		}).join('\n')

	let type = 0

	async function loaded() {


		sprite = new PIXI.Sprite( image.texture )

		const fragment = `
${lib}
${flattened}
varying vec2 vTextureCoord;
uniform sampler2D uSampler;

vec4 extract( vec3 hsv ) {

	float width = hue_width;
	float falloff = hue_falloff;
	float low = hue_point - width;
	float high = hue_point + width;
	float very_low = low - falloff;
	float very_high = high + falloff;

	vec3 inked = rgb2hsv( vec3(ink) );

	if ( within( hsv.x, very_low, very_high ) != 0 ) {

		float bright = hsv.z;

		int LOW = within( hsv.x, very_low, low );
		int HIGH = within( hsv.x, very_low, low );
		float HUE = hsv.x;

		if ( LOW != 0 ) {
			if (LOW == 2) HUE += 1.0;
			if (LOW == 3) HUE -= 1.0;
			bright *= map( HUE, very_low, low, 0.0, 1.0 );
		} else if ( HIGH != 0 ) {
			if (HIGH == 2) HUE += 1.0;
			if (HIGH == 3) HUE -= 1.0;
			bright *= map( HUE, high, very_high, 1.0, 0.0 );
		}

		bright = map(bright + (levels_mid - 0.5), levels_black, levels_white, 0.0, 1.0 );
		if (bright > inked.z && inked.y != 0.0) bright = inked.z;

		vec4 cp = ink;
		cp *= bright * opacity;
		return cp;
	} else {
		return vec4(0.0,0.0,0.0,0.0);
	}
}

void main(void) {

	vec3 color = vec3(texture2D(uSampler, vTextureCoord));
	if (invert == 1.0) color = vec3(1.0-color.r,1.0-color.g,1.0-color.b);
	vec3 hsv = rgb2hsv( color );


	if (type == 0.0) {
		gl_FragColor = extract( hsv );
	} else {
		vec4 cmyk = RGBtoCMYK( color );
		if (type == 1.0) gl_FragColor = vec4(ink * cmyk.x);
		if (type == 2.0) gl_FragColor = vec4(ink * cmyk.y);
		if (type == 3.0) gl_FragColor = vec4(ink * cmyk.z);
		if (type == 4.0) gl_FragColor = vec4(ink * cmyk.w);
		if (type == 5.0) gl_FragColor = vec4(ink * color.r);
		if (type == 6.0) gl_FragColor = vec4(ink * color.g);
		if (type == 7.0) gl_FragColor = vec4(ink * color.b);
	}

}`


	    // var gl = PIXI.instances[0].gl;
	    // PIXI.blendModes.NORMAL2 = 'normal2';
	    // PIXI.blendModesWebGL[PIXI.blendModes.NORMAL2] = [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA];

	    let filter = new PIXI.Filter(null, fragment, uniforms)
		sprite.filters = [ filter ]

		// filter.blendMode = PIXI.BLEND_MODES.SCREEN
		// sprite.blendMode = PIXI.BLEND_MODES.NORMAL

		stage.addChild( sprite )


		// container = new PIXI.Container()
		// container.addChild( sprite )
		// container.blendMode = PIXI.BLEND_MODES.ADD
		// container.filters = [getBlendFilter(PIXI.BLEND_MODES.SCREEN)]
		// stage.addChild( container )

		visualise()

	}


	function visualise() {

		let config = {
			width: 360, 
			height: 10,
			antialias: false,
			transparent: true,
			resolution: 1,
			forceCanvas: true
		}
		let app = new PIXI.Application(config)
		let graphic = new PIXI.Graphics()
		// graphic.beginFill( 0x000000 )
		graphic.drawRect(0, 0, config.width, config.height)

		const fragment = `
${lib}
${flattened}
varying vec2 vTextureCoord;
uniform sampler2D uSampler;

vec4 extract() {

	float width = hue_width / 2.0;
	float falloff = hue_falloff / 2.0;
	float low = hue_point - width;
	float high = hue_point + width;
	float very_low = low - falloff;
	float very_high = high + falloff;


	float hue = map( vTextureCoord.x, 0.0, 1.0, very_low, very_high);
	float bright = 1.0;

	if ( within( hue, very_low, low ) != 0 ) {
		bright = map( hue, very_low, low, 0.0, 1.0 );
	}
	if ( within( hue, high, very_high ) != 0 ) {
		bright = map( hue, high, very_high, 1.0, 0.0 );
	}

	vec3 hsv = vec3( hue, 1.0, bright );
	return vec4( hsv2rgb( hsv ), bright);

}

void main(void) {

	if (type == 0.0) {
		gl_FragColor = extract();
	} else {

		if (type == 1.0) gl_FragColor = vec4(0.0,1.0,1.0,1.0);
		if (type == 2.0) gl_FragColor = vec4(1.0,0.0,1.0,1.0);
		if (type == 3.0) gl_FragColor = vec4(1.0,1.0,0.0,1.0);
		if (type == 4.0) gl_FragColor = vec4(0.0);
		if (type == 5.0) gl_FragColor = vec4(1.0,0.0,0.0,1.0);
		if (type == 6.0) gl_FragColor = vec4(0.0,1.0,0.0,1.0);
		if (type == 7.0) gl_FragColor = vec4(0.0,0.0,1.0,1.0);
	}

}`

		graphic.filters = [new PIXI.Filter(null, fragment, uniforms)]
		app.stage.addChild(graphic)


		viz.appendChild(app.view)
	}

	function select(c) {
		colour = c
		overlay = false
	}

	let overlay = false
	let viz
	let invert = false

	let types = ['custom', '(c)myk', 'c(m)yk', 'cm(y)k', 'cmy(k)', '(r)gb', 'r(g)b', 'rg(b)']

</script>

<div class="flex column w16em p1">
	<div class="viz b1-solid p0 mb0-5" style="line-height:0px" bind:this={viz} />
	<div class="mb0-5">
		<div class="select w100pc mb0-2">
			<select bind:value={type}>
				{#each types as t,i}
					<option value={i} name={t}>{t}</option>
				{/each}
			</select>
		</div>
		{#if type == 0}
			{#each Object.entries(ui) as [name, two]}
				{#each Object.entries(two) as [id, o]}
					<div class="flex column cmb0-2">
						<label class="capitalize flex row-space-between-flex-start">
							<span>{id.replace('_', ' ')}</span>
							<span class="monospace">{o.value.toFixed(2)}</span>
						</label>
						<input type="range" bind:value={o.value} min={o.min} max={o.max} step={1.0/360} />
					</div>
				{/each}
			{/each}
		{/if}
	</div>
	<div 
		on:click={ e => invert = !invert} 
		class:filled={invert}
		class="p1 b1-solid mb0-5 clickable text-center">
		invert
	</div>
	<div class="flex column mb1">
		<div 
			style={`background-color:rgb(${colour?.rgb})`}
			class="align-left flex column b1-solid clickable rel mb2 ">
			<span 
				on:click={e => overlay = true}
				class="flex column p0-5">
				<span class="">{colour?.name}</span>
				<span class="">{colour?.japanese || '~'}</span>
			</span>
			<div 
				class="flex abs l0 t100pc w100pc maxh50vh b1-solid bg wrap overflow-auto z-index99"
				class:none={ !overlay }>
				{#each colours as c}
					<div 
						on:click={ e => select(c) }
						style={`background-color:rgb(${c.rgb});margin-top:-1px`}
						class="flex column p0-5 pointer no-basis grow minw16em clickable minh0em">
						<span 
							class="inverted flex column">
							<span>{c.name}</span>
							<span>{c.japanese}</span>
						</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
