<script>
	import lib from './lib.js'
	import colours from './colours.js'
	import * as PIXI from 'pixi.js'
	import { onMount } from 'svelte'
	import Layer from './Layer.svelte'

	let main, editor, app, stage, image, loader, ticker, mode, raw, bg

	export let src = 'sources/002.png'

	let layers = []

	onMount( async e => {


		loader = new PIXI.Loader()
		loader.add( src, {
			crossOrigin: 'anonymous'
		} )
		loader.load( loaded )

	})

	let uniforms = {}

	function setUniforms( bg ) {
		uniforms.invert = bg
		console.log('UNIS', uniforms)
	}

	$: setUniforms( BG )

	function background() {

		bg = new PIXI.Sprite( image.texture )

		const fragment = `
uniform bool invert;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;

void main(void) {

	vec3 color = vec3(texture2D(uSampler, vTextureCoord));
	gl_FragColor = (!invert) ? vec4(1.0) : vec4(0.0);

}`



	    let filter = new PIXI.Filter(null, fragment, uniforms)
		bg.filters = [ filter ]


		stage.addChild( bg )
	}

	function loaded(obj, resources) {

		image = resources[src]

		app = new PIXI.Application({
			width: image.data.width, 
			height: image.data.height,
			antialias: false,
			transparent: true,
			resolution: 1,
			forceCanvas: true
		})

		stage = app.stage

		// stage.addChild(bg)

		// app.renderer.backgroundColor = 0x000000
		editor.appendChild(app.view)

		// ticker = new PIXI.Ticker()
		// ticker.add(animate)
		// ticker.start()

		add()
		// add()
		// add()

		background()


		raw = new PIXI.Sprite( image.texture )
	}

	function toggle() {
		mode = !mode
		mode ? stage.addChild( raw ) : stage.removeChild( raw )
	}

	function add() {
		let cp = layers
		layers = []
		cp.push( {} )
		layers = cp
	}

	let BG = false

	function invert() {
		BG = !BG
	}


</script>

<main 
	style
	bind:this={main} class="flex row-flex-start-stretch bg">
	<div class="flex column-stretch-stretch minh100vh br1-solid maxh100vh">
		<header class="bb1-solid p1">
			RISO
		</header>
		<article 
			style="touch-action: pan-right pinch-zoom;"
			class="flex row grow w32em overflow-auto wrap">
			{#each layers as layer, index}
				<Layer 
					{index}
					bind:layer={layer} 
					bind:mode={mode} 
					bind:stage={stage} 
					bind:image={image} />
			{/each}
		</article>
		<footer class="bt1-solid p1">
			<button on:click={e => (e.target.blur())} on:click={add}>new layer</button>
			<button on:click={e => (e.target.blur())} class:filled={mode} on:click={toggle}>view</button>
			<button on:click={e => (e.target.blur())} on:click={invert}>background</button>
		</footer>
	</div>
	<section class="p0 grow flex row-center-center overflow-auto" bind:this={editor}>
	</section>
</main>
