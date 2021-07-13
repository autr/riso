<script>
	import lib from './lib.js'
	import * as PIXI from 'pixi.js'
	import { onMount } from 'svelte'
	import Layer from './Layer.svelte'
	import Palette from './Palette.svelte'
	import { get, set } from 'idb-keyval'
	import rectd from './rectd.js'
	import options from './options.js'

	let main, editor, app, stage, loader, mode

	let layers = window.layers = {
		background: new PIXI.Graphics(),
		container: new PIXI.Container(),
		images: new PIXI.Container(),
		processed: new PIXI.Container()
	}

	let pixi = {
		app: new PIXI.Application({
			antialias: false,
			transparent: true,
			resolution: 1,
			forceCanvas: true
		})
	}

	onMount( async e => {
		await init()
	})

	export let project
	export let files
	export let handlers


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


	async function init() {

		console.log('[Project] initing background and containers', calculate)

		editor.appendChild(pixi.app.view)

		layers.background.drawRect(0,0,calculate.width,calculate.height)
		layers.background.filters = [ new PIXI.Filter(null, `
			${lib}
			varying vec2 vTextureCoord;
			uniform sampler2D uSampler;
			uniform vec4 hsla;

			void main(void) {

				vec3 bg3 = vec3(hsla.x / 360.0, hsla.y / 100.0, hsla.z / 100.0);
				vec4 bg4 = vec4( hsl2rgb( bg3 ), 1.0 );
				gl_FragColor = bg4;

			}`, 
		uniforms)]

		pixi.app.stage.addChild( layers.background )
		pixi.app.stage.addChild( layers.container )
		layers.container.addChild( layers.processed )
		// layers.container.addChild( layers.images )

		await update( project.config )
	}


	function togglePreview( b ) {
		mode = b
		if (mode) {
			// rectd.auto( fit, raw )
			// stage.addChild( raw )
		} else {
			// stage.removeChild( raw )
		}
	}

	function addLayer() {
		let cp = project.layers
		project.layers = []
		cp.push( {} )
		project.layers = cp
	}


	async function update( config ) {
		if (pixi?.app?.renderer ) {
			const { width, height } = calculate
			if ( width != pixi.app.renderer.width || height != pixi.app.renderer.height) {
				console.log('[Project] canvas size updated', {width, height})
				await pixi.app.renderer.resize( width, height )
				layers.background.width = width
				layers.background.height = height
			}
		}
	}

	$: update( project.config )

	$: setup( files )

	async function setup( files ) {

		if (!files?.srcs) return
		if (!loader) loader = new PIXI.Loader()

		let list = project.files.filter( name => files.srcs[name] )
		if (list.length != project.files.length) return

		await loader.reset()
		for (const name of project.files) {
			let o = files.srcs[name]
			if (!loader.resources[o.url]) loader.add( o.url, { crossOrigin: 'anonymous' })
		}

		console.log('[Project] loading files...')
		loader.load( async e => {

			console.log('[Project] all files loaded', list)

			// await layers.images.destroy({children:false})

			const len = Object.keys(loader.resources).length
			const { width, height } = calculate
			const size = rectd.neu( 0, 0, width, height )
			const inner = rectd.shrinkBy( size, mm2px( project.config.margin ) )
			let splits = rectd.splitUp( inner, len )

			let i = 0
			for (const [name, resource] of Object.entries(loader.resources) ) {

				let sprite = new PIXI.Sprite( resource.texture )
				let image = rectd.neu( 0, 0, resource.data.width, resource.data.height )

				let fit = rectd.fitInto( image, inner )
				rectd.auto( fit, sprite )

				if (splits.length > 1) {
					let mask = new PIXI.Graphics()
					mask.drawRect(splits[i].x,splits[i].y,splits[i].width,splits[i].height)
					sprite.mask = mask
				}


				await layers.images.addChild( sprite )
				i += 1
			}

			// rectd.auto( inner, layers.container )
			// console.log(layers.container.width, '????', inner.width) 
			// layers.container.scale.x = 0.5


			addLayer()
		} )
	}


	let classes = {
		miniButtons: `p0 rel w3em h3em bg pointer z-index4 bt0-solid br0-solid`,
		lanes: `flex column br1-solid overflow-auto no-basis grow`
	}

	$: needsSync = files.handles.filter( h => !files.srcs[h.name] )

	let targets = {}

</script>

<main 
	style
	bind:this={main} class="flex row-stretch-stretch bg overflow-auto">
	<div class="basis30pc minw52em maxw62em flex column-stretch-stretch grow minh100vh maxh100vh">
		<sidebar 
			class="flex row grow overflow-hidden">
			<section class={classes.lanes}>
				<div class="p1">
					<button 
						disabled={needsSync}
						on:click={handlers.requestAll} 
						class="w100pc">
						Sync files
					</button>
					<button 
						on:click={handlers.accessFiles} 
						class="w100pc mt1">
						Add files
					</button>
					<button 
						on:click={handlers.clearAllHandles} 
						class="w100pc mt1">
						Clear all
					</button>
				</div>
				{#each files.handles as handle, i}
					<div 
						class:bt1-solid={i==0}
						class="rel bb1-solid file">
						<div class="overlay abs t0 r0 flex grow row-flex-end-flex-start z-index2">
							<!-- <span class="fill bg " style="opacity:0.9"  /> -->
							<button 
								on:click={ e => handlers.requestFile( handle ) }
								class={classes.miniButtons}>
								⟳
							</button>
							<button 
								on:click={ e => handlers.removeHandle( handle ) } 
								class={classes.miniButtons}>
								✕
							</button>
						</div>
						<div on:click={e => handlers.selectImage(handle)}>
							{#if files.srcs[handle.name]}
									<img 
										class="pointer" 
										src={files.srcs[handle.name].url} 
										alt={handle.name} />
							{:else}
								<div 
									class=" minh8em flex row-center-center">
									{handle.name}
								</div>
							{/if}
						</div>

					</div>
				{/each}
					
				{#if files.handles.length == 0 }
					<div class="p1">No files</div>
				{/if}
			</section>



			<section class={classes.lanes + ' basis0pc'}>
				PROJECTS
			</section>


			<section id="layers" class={classes.lanes + ' basis20pc'}>
				<div class="p1 flex column cmb1">

					<aside>
						{#each project.files as file}
							<div class="flex row-stretch-stretch" style="margin-top:-1px">
								<div class="flex column-stretch-stretch">
									<button class="p0 no-basis grow flex row-center-center w2em">^</button>
									<button class="p0 no-basis grow flex row-center-center w2em bt0-solid">,</button>
								</div>
								<span class="bt1-solid bb1-solid h4em flex column-flex-start-center plr1 grow">{file}</span>
								<button class="cross w2em p0 h4em" />
							</div>
						{/each}
					</aside>

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
						bind:container={layers.processed}
						bind:images={layers.images}
						bind:layer={layer} />
				{/each}
			</section>
		</sidebar>
		<footer class="p1 bt1-solid br1-solid">
			RISO3000
		</footer>
	</div>
	<section class="no-basis minw2em br1-solid maxh100vh flex column overflow-hidden palette">
		{#each project.layers as layer, i}
			<div 
				class="flex pointer minw2em bb1-solid no-basis row grow">
				<Palette {layer} vertical={true} />
				<span class="abs hidden">{i}</span>
			</div>
		{/each}
	</section>
	<section 
		on:mousedown={ e => togglePreview( true ) }
		on:mouseup={ e => togglePreview( false ) }
		class="basis70pc minw50em pointer grow flex row-center-flex-start overflow-auto maxh100vh overflow-auto">
		<div
			class="flex p4"
			bind:this={editor} />
	</section>
</main>
