<script>
	import lib from './lib.js'
	import * as PIXI from 'pixi.js'
	import { onMount } from 'svelte'
	import Layer from './Layer.svelte'
	import { get, set } from 'idb-keyval'

	let main, editor, app, stage, image, loader, ticker, mode, raw, bg

	export let src = 'sources/002.png'

	export let project = {
		layers: [],
		config: {},
		files: []
	}
	let layers = []

	onMount( setup )

	let uniforms = {}

	function setUniforms( bg ) {
		uniforms.invert = bg
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


		add()

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




	function selectImage( e ) {
		console.log('IMAGE CLICKED!', e)
	}



	async function setup() {

		loader = new PIXI.Loader()
		loader.add( src, {
			crossOrigin: 'anonymous'
		} )
		loader.load( loaded )
		handles = await get( FILES_KEY )

	}

	async function requestFile( handle ) {

		let opts = {mode: 'read'}
		let permission = await handle.queryPermission(opts)
		if (permission  != 'granted') permission = await handle.requestPermission(opts)
		if (permission == 'granted') {
			const file = await handle.getFile()
			srcs[handle.name] = URL.createObjectURL(file)
		} else {
			window.alert(`Could not load ${handle.name}!`)
		}
	}

	async function loadFiles() {

		handles = await get( FILES_KEY )
		for( const handle of handles) requestFile( handle )
	}



	let handles = []
	let srcs = {}
	const KEY = 'RISOGRAPHINATOR'
	const FILES_KEY = `${KEY}_FILES`
	const PROJECTS_KEY = `${KEY}_PROJECTS`

	async function accessFiles(e) {
		let neu = await window.showOpenFilePicker({
			types: [
				{
					description: 'Images',
					accept: { 'image/*': ['.png', '.gif', '.jpeg', '.jpg'] }
				}
			],
			excludeAcceptAllOption: true,
			multiple: true
		})

		handles = handles.concat(neu)
		await set( FILES_KEY, handles )
		await loadFiles()
	}

	let isSynced = false

	function checkSync( handles, srcs ) {
		isSynced = true
		for( const handle of handles ) {
			if (!srcs[handle.name]) isSynced = false
		}
	}

	$: checkSync(handles, srcs)


	let FILES = {}
	let PROJECTS = []

	async function removeHandle( handle ) {
		if (!window.confirm(`Remove ${handle.name} from bin?`)) return
		let cp = handles
		handles = []
		const idx = cp.indexOf(handle)
		if (idx != -1) cp.splice( idx, 1 )
		handles = cp
		await set( FILES_KEY, handles )
	}

	let classes = {
		miniButtons: `p0 rel w3em h3em bg pointer z-index4 bt0-solid br0-solid`,
		lanes: `flex column br1-solid overflow-auto no-basis grow`
	}

</script>

<main 
	style
	bind:this={main} class="flex row-stretch-stretch bg">
	<div class="basis30pc minw42em maxw52em flex column-stretch-stretch grow minh100vh maxh100vh">
		<header class="bb1-solid p1 br1-solid">
			RISO
			<button on:click={loadFiles}>Load</button>
			<button on:click={e => (e.target.blur())} on:click={add}>new layer</button>
			<button on:click={e => (e.target.blur())} class:filled={mode} on:click={toggle}>view</button>
			<button on:click={e => (e.target.blur())} on:click={invert}>background</button>
		</header>
		<sidebar 
			class="flex row grow overflow-hidden">
			<section class={classes.lanes}>
				<div class="p1">
					<button 
						disabled={isSynced}
						on:click={loadFiles} 
						class="w100pc">
						Sync files
					</button>
					<button 
						on:click={accessFiles} 
						class="w100pc mt1">
						Add files
					</button>
				</div>
				{#each handles as handle, i}
					<div 
						class:bt1-solid={i==0}
						class="rel bb1-solid file">
						<div class="overlay fill flex grow row-flex-end-flex-start z-index2">
							<!-- <span class="fill bg " style="opacity:0.9"  /> -->
							<button 
								on:click={ e => requestFile( handle ) }
								class={classes.miniButtons}>
								⟳
							</button>
							<button 
								on:click={ e => removeHandle( handle ) } 
								class={classes.miniButtons}>
								✕
							</button>
						</div>
						{#if srcs[handle.name]}
								<img 
									class="pointer" 
									on:click={selectImage} 
									src={srcs[handle.name]} 
									alt={handle.name} />
						{:else}
							<div 
								class=" minh8em flex row-center-center">
								{handle.name}
							</div>
						{/if}

					</div>
				{/each}
					
				{#if handles.length == 0 }
					<div class="p1">No files</div>
				{/if}
			</section>
			<section class={classes.lanes}>
			</section>
			<section class={classes.lanes + ' p1'}>
				{#each layers as layer, index}
					<Layer 
						{index}
						bind:layer={layer} 
						bind:mode={mode} 
						bind:stage={stage} 
						bind:image={image} />
				{/each}
			</section>
		</sidebar>
	</div>
	<section class="basis70pc  p0 grow flex row-center-center overflow-auto" bind:this={editor}>
	</section>
</main>
