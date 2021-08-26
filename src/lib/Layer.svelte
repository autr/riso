<script>
	import glLib from './_gl.js'
	import colours from './_colours.js'
	import * as PIXI from 'pixi.js'
	import { onMount } from 'svelte'
	import gui from './_gui.js'
	import Palette from './Palette.svelte'

	export let layer = {}
	export let index = 0
	export let solo = null
	export let project = {}
	export let pixi 
	export let group

	let filter

	function setDefaults( layer_ ) {
		for ( const g of gui.config) if (!layer[g.name]) layer[g.name] = g.default
	}

	$: setDefaults(layer)


	let id

	function setStringId( layer_ ) {

		const pad = num => (Math.round(num).toString().padStart(3, '0'))
		let i = layer.type || 0
		id = `L${index + 1}_`
		id += `${(colours[layer.colour]?.name || '').replaceAll(' ', '')}_`
		id += `${types[i].toUpperCase()[0]}`
		const {hue_point, hue_width, hue_falloff} = layer
		if (i ==0) id += `${pad(hue_point*360)}${pad(hue_width*100)}${pad(hue_falloff*100)}`
		id += `_I${layer.invert ? 1 : 0}_`
		const {levels_low, levels_mid, levels_high, opacity} = layer
		id += `L${pad(levels_low*100)}${pad(levels_mid*100)}${pad(levels_high*100)}_`
		id += `O${pad(opacity*100)}`
	}

	$: setStringId( layer )


	onMount( setup )


	let type = 0

	async function setup() {

	    
	    if (layer.solo == null) layer.solo = false
	    if (layer.muted == undefined) layer.muted = false
		if (layer.type == undefined) layer.type = 0
		if (layer.colour == undefined) layer.colour = parseInt(Math.random() * colours.length)

		layer.seed = Math.random()
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

	float width = hue_width * 0.5;
	float balance = hue_balance;
	float falloff = ( ( 1.0 - hue_width ) / 2.0 ) * hue_falloff;
	float low = hue_point - width;
	float high = hue_point + width;
	float very_low = low - falloff;
	float very_high = high + falloff;

	// vec3 inked = rgb2hsv( vec3(ink) );

	if ( within( hsv.x, very_low, very_high ) != 0 ) {

		float saturation = hsv.y;
		float bright = hsv.z;
		float final = ((1.0 - balance) * bright) + (balance * saturation);

		int LOW = within( hsv.x, very_low, low );
		int HIGH = within( hsv.x, high, very_high );
		float HUE = hsv.x;

		if ( LOW != 0 ) {
			if (LOW == 2) HUE += 1.0;
			if (LOW == 3) HUE -= 1.0;
			final *= map( HUE, very_low, low, 0.0, 1.0 );
		} else if ( HIGH != 0 ) {
			if (HIGH == 2) HUE += 1.0;
			if (HIGH == 3) HUE -= 1.0;
			final *= map( HUE, high, very_high, 1.0, 0.0 );
		}

		return final;

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

	if (solo) ink = vec3(1.0,0.0,0.0);
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

	power = clamp( map(power + (levels_mid - 0.5), levels_low, levels_high, 0.0, 1.0 ), 0.0, 1.0);

	// float noiz = map( snoise(vec2(hsv.r * 0.1, hsv.g * 0.1)), 0.0, 1.0, opacity - 1.0, opacity);

	if (solo) {
		gl_FragColor = vec4(ink,1.0) * power * opacity;
	} else {
		gl_FragColor = vec4(ink,1.0) * power * opacity;
	}

}`

		let fragment = window.fragment = `${glLib}\n${header}\n${program}`


		filter = new PIXI.Filter(null, fragment, layer)

		let noise = new PIXI.filters.NoiseFilter(1.0)
		group.filters = [ filter ]

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

<div 
	class="flex column bb1-solid" >
	<div class="mb0-5 plr1 pb1">

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
			<div 
				class="flex row-flex-end-center mt1 w100pc"
				class:none={ !isNaN(ui.link) && ui.link != layer.type}>

				{#if ui.label}

					<label class="no-basis capitalize grow flex row-flex-start-flex-start">
						<span>{ui.label}</span>
						<!-- {#if ui.type =='float'}
							<span class="monospace">{layer[ui.name]}</span>
						{/if} -->
					</label>
				{/if}
				{#if ui.type == 'bool'}


					<div 
						on:click={e => layer[ui.name] = !layer[ui.name]}
						class="br0-solid flex row-flex-end-center">
						<span 
							class="b1-solid rel checker w2em h2em block">
							<span class:cross={layer[ui.name]} class="fill" />
						</span>
					</div>
				{:else if ui.type == 'float'}
					<input 
						class="no-basis grow maxw60pc w60pc minw60pc round ml2 radius1em"
						type="range" 
						bind:value={layer[ui.name]} 
						min="-0.000001" 
						max="1" 
						step="0.001" />
				{/if}
			</div>
		{/each}
<!-- 
		<div class="plr1 ptb0-5 fade mt2 monospace sink overflow-hidden">
			<span class="normal">{id}</span>
		</div> -->
	</div>
</div>
