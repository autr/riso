<script>
	import lib from './lib.js'
	import colours from './colours.js'
	import * as PIXI from 'pixi.js'
	import {Sprite, getBlendFilter} from '@pixi/picture'
	import { onMount } from 'svelte'
	import gui from './gui.js'
	import Palette from './Palette.svelte'

	export let layer = {}
	export let index = 0
	export let container
	export let images
	export let target

	let group

	function setDefaults( layer_ ) {
		for ( const g of gui.config) if (!layer[g.name]) layer[g.name] = g.default
	}

	$: setDefaults(layer)


	onMount( setup )


	let type = 0

	async function setup() {

	    // var gl = PIXI.instances[0].gl
	    // PIXI.blendModes.NORMAL2 = 'normal2'
	    // PIXI.blendModesWebGL[PIXI.blendModes.NORMAL2] = [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA]
		// filter.blendMode = PIXI.BLEND_MODES.SCREEN
		// sprite.blendMode = PIXI.BLEND_MODES.SCREEN
	    
		layer.type = 0
		layer.colour = parseInt(Math.random() * colours.length)
		layer.colours = colours.map( c => {
	    	return c.rgb.split(',').map( l => {
	    		return parseFloat((parseFloat(l) / 255).toFixed(3))
	    	})
	    }).flat()
		group = new PIXI.Container()
		group.addChild( images )


	    let header = `
uniform vec3 colours[${colours.length}];
${gui.header}
varying vec2 vTextureCoord;
uniform sampler2D uSampler;`


		let program = `
vec4 extract( vec3 hsv, vec3 ink ) {

	float width = hue_width;
	float falloff = hue_falloff;
	float low = hue_point - width;
	float high = hue_point + width;
	float very_low = low - falloff;
	float very_high = high + falloff;

	vec3 inked = rgb2hsv( vec3(ink) );

	if ( within( hsv.x, very_low, very_high ) != 0 ) {

		float sat = hsv.y;
		float bright = hsv.z;

		int LOW = within( hsv.x, very_low, low );
		int HIGH = within( hsv.x, high, very_high );
		float HUE = hsv.x;

		if ( LOW != 0 ) {
			if (LOW == 2) HUE += 1.0;
			if (LOW == 3) HUE -= 1.0;
			sat *= map( HUE, very_low, low, 0.0, 1.0 );
		} else if ( HIGH != 0 ) {
			if (HIGH == 2) HUE += 1.0;
			if (HIGH == 3) HUE -= 1.0;
			sat *= map( HUE, high, very_high, 1.0, 0.0 );
		}

		sat = map(sat + (levels_mid - 0.5), levels_low, levels_high, 0.0, 1.0 );
		if (sat > inked.z && inked.y != 0.0) sat = inked.z;

		vec4 end = vec4(ink, 1.0);
		end *= sat * opacity;
		return end;
	} else {
		return vec4(0.0,0.0,0.0,0.0);
	}
}

vec3 getInk() {
    for (int i=0; i < ${colours.length}; i++) {
        if (i == colour) return colours[i];
    }
}

void main(void) {

	vec3 color = vec3(texture2D(uSampler, vTextureCoord));
	if (invert) color = vec3(1.0-color.r,1.0-color.g,1.0-color.b);
	vec3 hsv = rgb2hsv( color );
	vec3 ink = getInk();


	if (type == 0) {
		gl_FragColor = extract( hsv, ink );
	} else {
		vec4 cmyk = RGBtoCMYK( color );
		if (type == 1) gl_FragColor = vec4(ink * cmyk.x, 1.0);
		if (type == 2) gl_FragColor = vec4(ink * cmyk.y, 1.0);
		if (type == 3) gl_FragColor = vec4(ink * cmyk.z, 1.0);
		if (type == 4) gl_FragColor = vec4(ink * cmyk.w, 1.0);
		if (type == 5) gl_FragColor = vec4(ink * color.r, 1.0);
		if (type == 6) gl_FragColor = vec4(ink * color.g, 1.0);
		if (type == 7) gl_FragColor = vec4(ink * color.b, 1.0);
	}

}`
		let fragment = window.fragment = `${lib}\n${header}\n${program}`

		group.filters = [ new PIXI.Filter(null, fragment, layer) ]


		container.addChild( group )

		// visualise()

	}


	function select(i) {
		layer.colour == i
		overlay = false
	}

	let overlay = false

	let types = ['Picker', 'Cyan', 'Magenta', 'Yellow', 'Key', 'Red', 'Green', 'Blue']

	let TEST
</script>

<!-- <div bind:this={TEST} /> -->
<!-- <Palette bind:layer={layer} bind:target={TEST} /> -->

<div class="flex column">
	<div class="mb0-5">
		<div class="flex row-stretch-stretch grow w100pc">
			<div class="basis5em h100pc select">
				<select class="br0-solid" bind:value={layer.type} style="letter-spacing: 4em">
					{#each types as t,i}
						<option value={i} name={t}>{t}</option>
					{/each}
				</select>
				<!-- ➡ ➜ → ➪ ↔ -->
			</div>
			<div class="flex no-basis h100pc grow ">
				<span 
					on:click={e => overlay = true}
					class="select grow">
					<span class="flex ptb0-6 plr1 grow pr3 b1-solid focusable clickable">
						{(colours[layer.colour]?.name || '').toLowerCase()}
					</span>
				</span>
				<div 
					class="flex fixed l0 t0 h100vh w100vw h100pc b1-solid bg wrap overflow-auto z-index99"
					class:none={ !overlay }>
					{#each colours as c, i}
						<div 
							on:click={ e => select(i) }
							style={`background-color:rgb(${c.rgb});margin-top:-1px`}
							class="flex column pointer no-basis grow minw16em clickable minh0em">
							<span 
								class="inverted flex column p1">
								<span>{c.name}</span>
								<span>{c.japanese || '-'}</span>
							</span>
						</div>
					{/each}
					{#each new Array(10) as ii,i}
						<span class="flex column pointer no-basis grow minw16em clickable h0em" style="line-height:0px;max-height:0px" />
					{/each}
				</div>
			</div>
		</div>

		{#each gui.config as ui}
			<div class="flex column cmb0-2">
				{#if ui.label}

					<label class="capitalize flex row-space-between-flex-start">
						<span>{ui.label}</span>
						{#if ui.type =='float'}
							<span class="monospace">{layer[ui.name].toFixed(2)}</span>
						{/if}
					</label>
				{/if}
				{#if ui.type == 'boolean'}
					<input type="checkbox" bind:checked={layer[ui.name]} />
				{:else if ui.type == 'float'}
					<input type="range" bind:value={layer[ui.name]} min="0" max="1" step={1.0/360} />
				{/if}
			</div>
		{/each}
	</div>
</div>
