<script>
	import lib from './lib.js'
	import * as PIXI from 'pixi.js'
	import { onMount } from 'svelte'
	import Layer from './Layer.svelte'
	import { get, set } from 'idb-keyval'
	import colorString from 'color-string'
	import rectd from './rectd.js'

	let main, editor, app, stage, image, loader, ticker, mode, raw, bg, group

	export let src = 'sources/swiss.png'

	const gen = {
		bg: (name, colour, grain) => ({
			name,
			colour: colorString.get.hsl(colour),
			grain
		}),
		size: (name, width, height) => ({
			name,
			xy: [width,height]
		})
	}

	let options = {
		backgrounds: [
			gen.bg( 'Ultra black', `hsl(0, 0%, 5%)`, 0.5),
			gen.bg( 'Blue black', `hsl(200, 60%, 10%)`, 0.5),
			gen.bg( 'Bone white', `hsl(0, 0%, 98%)`, 0.1),
			gen.bg( 'Warm white', `hsl(50, 90%, 97%)`, 0.1)
		],
		sizes: [
			gen.size( 'A4 (landscape)', 297, 210 ),
			gen.size( 'A4 (portrait)', 210, 297 ),
			gen.size( 'A3 (landscape)', 420, 297 ),
			gen.size( 'A3 (portrait)', 297, 420 ),
			gen.size( 'A2 (landscape)', 594, 420 ),
			gen.size( 'A2 (portrait)', 420, 594 )
		]
	}

	export let project = {
		layers: [],
		config: {
			background: options.backgrounds[0].name,
			size: options.sizes[0].name,
			dpi: 300,
			margin: 0
		},
		files: [ 'sources/swiss.png' ]
	}

	onMount( setup )

	let uniforms = {}

	$: _uniforms = {
		hsla: options.backgrounds.find( b => b.name == project.config.background ).colour,
		size: options.sizes.find( b => b.name == project.config.size ).xy
	}

	function setUniforms( unis ) {
		uniforms.hsla = unis.hsla
		uniforms.size = unis.size
	}

	$: setUniforms( _uniforms )

	const mm2px = mm => ( Math.round( ( project.config.dpi / 25.4 ) * mm ) )

	$: calculate = {
		width: mm2px( _uniforms.size[0] ) * 0.25,
		height: mm2px( _uniforms.size[1] ) * 0.25
	}

	let fit = {}

	async function update( config ) {
		if (app?.renderer) {
			console.log('[Project] update sizes')
			const { width, height } = calculate
			await app.renderer.resize( width, height )
			const print = rectd.neu(0, 0, image.data.width, image.data.height )
			const inner = rectd.shrinkBy( rectd.neu( 0, 0, width, height ), mm2px( project.config.margin ) )
			fit = rectd.fitInto( print, inner )
			rectd.auto( fit, group )

		}
	}

	$: update( project.config )

	function createBackground() {

		bg = new PIXI.Sprite( image.texture )

		const fragment = `
${lib}
uniform bool invert;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 hsla;

void main(void) {

	vec3 bg3 = vec3(hsla.x / 360.0, hsla.y / 100.0, hsla.z / 100.0);
	vec4 bg4 = vec4( hsl2rgb( bg3 ), 1.0 );
	gl_FragColor = bg4;

}`

	    let filter = new PIXI.Filter(null, fragment, uniforms)
		bg.filters = [ filter ]

		stage.addChild( bg )
		window.group = group = new PIXI.Container()
		stage.addChild( group )
	}

	function loaded(obj, resources) {

		image = resources[src]

		window.app = app = new PIXI.Application({
			width: calculate.width, 
			height: calculate.height,
			antialias: false,
			transparent: true,
			resolution: 1,
			forceCanvas: true
		})

		stage = app.stage
		editor.appendChild(app.view)

		addLayer()
		createBackground()
		raw = new PIXI.Sprite( image.texture )
	}

	function togglePreview( b ) {
		mode = b
		if (mode) {
			rectd.auto( fit, raw )
			stage.addChild( raw )
		} else {
			stage.removeChild( raw )
		}
	}

	function addLayer() {
		let cp = project.layers
		project.layers = []
		cp.push( {} )
		project.layers = cp
	}

	let BG = false

	function invert() {
		BG = !BG
	}

	async function loadImages() {
		console.log('LOADING IMAGES')
		if (!loader) loader = new PIXI.Loader()
		await loader.reset()
		for (const file of project.files) loader.add( file, { crossOrigin: 'anonymous' })
		loader.load( loaded )
	}

	async function setup() {

		await loadImages()
		await loadDb()
		await requestAll()

	}


	// --------- App --------------

	function selectImage( e ) {
		console.log('IMAGE CLICKED!', e)
	}


	let handles = [
		{
			name: 'color_test.png',
			url: 'sources/swiss.png',
			static: true
		}
	]
	let srcs = {}
	const KEY = 'RISOGRAPHINATOR'
	const FILES_KEY = `${KEY}_FILES`
	const PROJECTS_KEY = `${KEY}_PROJECTS`


	async function requestFile( handle ) {

		if (handle.static) {
			srcs[handle.name] = handle
		} else {

	 		let opts = {mode: 'read'}
			let permission = await handle.queryPermission(opts)
			if (permission  != 'granted') permission = await handle.requestPermission(opts)
			if (permission == 'granted') {
				const file = await handle.getFile()
				srcs[handle.name] = {
					name: handle.name,
					url: URL.createObjectURL(file)
				}
			} else {
				window.alert(`Could not load ${handle.name}!`)
			}
		}
	}

	async function loadDb() {
		handles = handles.concat( (await get( FILES_KEY )) || [] )
	}

	async function requestAll() {
		await loadDb()
		for( const handle of handles) requestFile( handle )
	}

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
		await set( FILES_KEY, handles.filter( h => !h.static ) )
		await requestAll()
	}

	let isSynced = false

	function syncSrcs( handles, srcs ) {
		isSynced = true
		for( const handle of handles ) {
			if (!srcs[handle.name]) isSynced = false
		}
	}

	$: syncSrcs(handles, srcs)


	let FILES = {}
	let PROJECTS = []

	async function removeHandle( handle ) {
		if (!window.confirm(`Remove ${handle.name} from bin?`)) return
		let cp = handles
		handles = []
		const idx = cp.indexOf(handle)
		if (idx != -1) cp.splice( idx, 1 )
		handles = cp
		await set( FILES_KEY, handles.filter( h => !h.static ) )
	}
	async function clearAllHandles( handle ) {
		if (!window.confirm(`Remove all files from bin?`)) return
		handles = handles.filter( h => h.static )
		await set( FILES_KEY, [] )
	}

	let classes = {
		miniButtons: `p0 rel w3em h3em bg pointer z-index4 bt0-solid br0-solid`,
		lanes: `flex column br1-solid overflow-auto no-basis grow`
	}

</script>

<main 
	style
	bind:this={main} class="flex row-stretch-stretch bg overflow-auto">
	<div class="basis30pc minw52em maxw62em flex column-stretch-stretch grow minh100vh maxh100vh">
		<header class="bb1-solid p1 br1-solid">
		</header>
		<sidebar 
			class="flex row grow overflow-hidden">
			<section class={classes.lanes}>
				<div class="p1">
					<button 
						disabled={isSynced}
						on:click={requestAll} 
						class="w100pc">
						Sync files
					</button>
					<button 
						on:click={accessFiles} 
						class="w100pc mt1">
						Add files
					</button>
					<button 
						on:click={clearAllHandles} 
						class="w100pc mt1">
						Clear all
					</button>
				</div>
				{#each handles.reverse() as handle, i}
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
									src={srcs[handle.name].url} 
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
			<section class={classes.lanes + ' basis0pc'}>
				PROJECTS
			</section>
			<section id="layers" class={classes.lanes + ' basis20pc'}>
				<div class="p1 flex column cmb1">
					<div>
						{calculate.width} x {calculate.height}
					</div>
					<div class="select">
						<select bind:value={project.config.background}>
							{#each options.backgrounds as bg}
								<option value={bg.name} name={bg.name}>{bg.name}</option>
							{/each}
						</select>
					</div>
					<div class="select">
						<select bind:value={project.config.size}>
							{#each options.sizes as sz}
								<option value={sz.name} name={sz.name}>{sz.name}</option>
							{/each}
						</select>
					</div>
					<input 
						min={150}
						max={600}
						step={50}
						type="number" 
						placeholder="DPI" 
						bind:value={project.config.dpi} />
					<input 
						min={0}
						max={Math.max( _uniforms.size[0], _uniforms.size[1] ) * 0.4 }
						step={1}
						type="number" 
						placeholder="Margin" 
						bind:value={project.config.margin} />
					<button 
						class="w100pc"
						on:click={e => (e.target.blur())} 
						on:click={addLayer}>
						Add layer
					</button>
				</div>
				{#each project.layers as layer, index}
					<Layer 
						{index}
						bind:group={group}
						bind:layer={layer} 
						bind:mode={mode} 
						bind:stage={stage} 
						bind:image={image} />
				{/each}
			</section>
			<section class="no-basis w2em br1-solid">
				Hello
			</section>
		</sidebar>
	</div>
	<section 
		on:mousedown={ e => togglePreview( true ) }
		on:mouseup={ e => togglePreview( false ) }
		class="basis70pc minw50em pointer grow flex row-center-flex-start overflow-auto maxh100vh overflow-auto">
		<div
			class="flex p4"
			bind:this={editor} />
	</section>
</main>
