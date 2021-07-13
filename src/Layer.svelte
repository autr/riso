<script>
	import lib from './lib.js'
	import colours from './colours.js'
	import * as PIXI from 'pixi.js'
	import { onMount } from 'svelte'
	import gui from './gui.js'
	import Palette from './Palette.svelte'

	export let layer = {}
	export let index = 0
	export let container
	export let images
	export let target
	export let solo = null
	export let project = {}

	let group

	function setDefaults( layer_ ) {
		for ( const g of gui.config) if (!layer[g.name]) layer[g.name] = g.default
	}

	$: setDefaults(layer)


	onMount( setup )


	let type = 0

	async function setup() {

	    
	    if (layer.solo == null) layer.solo = false


	    layer.muted = false
		layer.type = 0
		layer.colour = parseInt(Math.random() * colours.length)
		layer.seed = Math.random();
		layer.colours = colours.map( c => {
	    	return c.rgb.split(',').map( l => {
	    		return parseFloat((parseFloat(l) / 255).toFixed(3))
	    	})
	    }).flat()


	    let header = `
uniform vec3 colours[${colours.length}];
uniform bool solo;
uniform float seed;
${gui.header}
varying vec2 vTextureCoord;
uniform sampler2D uSampler;`

		let program = `
float extract( vec3 hsv ) {

	float width = hue_width;
	float falloff = hue_falloff;
	float low = hue_point - width;
	float high = hue_point + width;
	float very_low = low - falloff;
	float very_high = high + falloff;

	// vec3 inked = rgb2hsv( vec3(ink) );

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

		return map(sat + (levels_mid - 0.5), levels_low, levels_high, 0.0, 1.0 );

	} else {
		return 0.0;
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

	if (solo) ink = vec3(1.0,1.0,1.0);
	float power = 0.0;

	if (type == 0) {
		power = extract( hsv );
	} else {
		vec4 cmyk = RGBtoCMYK( color );
		if (type == 1) power = cmyk.x;
		if (type == 2) power = cmyk.y;
		if (type == 3) power = cmyk.z;
		if (type == 4) power = cmyk.w;
		if (type == 5) power = color.r;
		if (type == 6) power = color.g;
		if (type == 7) power = color.b;
	}


	// vec4 end = vec4(ink, 1.0);
	// end *= power * opacity;

	float noiz = map( noise(vec2(hsv.z, hsv.x), 99999999.0 * seed), 0.0, 1.0, opacity - 0.2, opacity);

	gl_FragColor = vec4(ink,1.0) * noiz * power;

}`
		let fragment = window.fragment = `${lib}\n${header}\n${program}`

		group = new PIXI.Container()
		group.filters = [ new PIXI.Filter(null, fragment, layer) ]
		container.addChild( group )
	    // if (layer.flag) return
		group.addChild( images )

		// visualise()

	}


	function select(i) {
		layer.colour = i
		overlay = false
	}

	let overlay = false

	let types = ['Picker', 'Cyan', 'Magenta', 'Yellow', 'Key', 'Red', 'Green', 'Blue']

	let TEST


	function onMute( muted_, solo_ ) {
		if (group) {

			if (solo_ != null) {
				console.log(`[Layer:${index}] 👁  solo set`)
				group.visible = solo_ == index
			} else if (group.visible != !muted_) {
				group.visible = !muted_
				console.log(`[Layer:${index}] 🔊  muted is set ${group.visible}`)
			}
			
		}
	}

	function onSolo() {
		solo = solo == null ? index : null
		layer.solo = solo == index && solo != null

	}

	$: onMute( layer.muted, solo )

	function move(from, to) {
		let cp = project.files
		project.layers = []
		let i = cp.splice(from, 1)[0]
		cp.splice(to, 0, i)
		project.layers = cp
	}
	function onLayerDown( idx ) {
		let to = idx + 1
		if (to >= project.files.length) return
		move( idx, to )

	}
	function onLayerUp( idx ) {
		let to = idx - 1
		if (to < 0) return
		move( idx, to )
	}
	let topRight = `h3em w3em p0 m0 br0-solid flex row-center-center`
	let arrowClass = `p0 no-grow flex row-center-center w3em b0-solid`


</script>

<!-- <div bind:this={TEST} /> -->

<div class="flex column">
	<div class="mb0-5">
		<div 
			on:click={e => overlay = true}
			class="h2em flex column mb1 w100pc b1-solid">
			<Palette bind:layer={layer} />
		</div>
		> {solo} / S {layer.solo} / M {layer.muted}
		<div class="mb1 flex row-space-between-center br1-solid">

			<!-- TITLE -->
			<span class=" sink h3em flex row-flex-start-center pl1 grow mr1">
				L{(index + 1).toString().padStart(3, '0')}
			</span>


			<!-- BUTTONS -->

			<div class="flex row ">
				<button 
					on:click={ e => layer.muted = !layer.muted }
					class:filled={layer.muted} 
					class="{topRight}">M</button>
				<button 
					class:filled={solo == index}
					on:click={ onSolo }
					class="{topRight} br1-solid">S</button>
				<button 
					on:click={ e => onLayerUp(idx) }
					class="{topRight} arrow rotate180 br1-solid bl0-solid ml1" />
				<button 
					on:click={ e => onLayerDown(idx) }
					class="{topRight} arrow bl1-solid " />
				<button class="{topRight}"><span class="cross block w1em h1em" /></button>
			</div>
		</div>
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

				<!-- COLOURS OVERLAY -->

				<div 
					class="flex fixed l0 t0 h100vh w100vw h100pc b1-solid bg wrap overflow-auto z-index99"
					class:none={ !overlay }>
					{#each colours as c, i}
						<div 
							on:click={ e => select(i) }
							style={`background-color:rgb(${c.rgb});margin-top:-1px;margin-left:-1px`}
							class="b1-solid flex column pointer no-basis grow minw16em minh0em">
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
					<input 
						class="round radius1em"
						type="range" 
						bind:value={layer[ui.name]} 
						min="0" 
						max="1" 
						step={1.0/360} />
				{/if}
			</div>
		{/each}
	</div>
</div>
