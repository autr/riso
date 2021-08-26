<script>
	import glLib from './_gl.js'
	import * as PIXI from 'pixi.js'
	import { onMount } from 'svelte'
	import { get, set } from 'idb-keyval'
	import rectd from './_rectd.js'
	import options from './_options.js'

	import Layers from './Layers.svelte'
	import Palette from './Palette.svelte'
	import Title from './Title.svelte'
	import Canvas from './Canvas.svelte'

	let main, app, stage, loader, mode
	let solo = null

	window.PIXI = PIXI
	PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST

	let layers = window.layers = {
		background: new PIXI.Graphics(),
		container: new PIXI.Container(),
		groups: [],
		processed: new PIXI.Container()
	}

	let pixi = window.pixi = {
		app: new PIXI.Application({
			antialias: false,
			transparent: true,
			resolution: 1,
			forceCanvas: true,
			preserveDrawingBuffer: true
		}),
		loader: new PIXI.Loader()
	}

	// let thumb = new PIXI.Application({
	// 	antialias: false,
	// 	transparent: true,
	// 	resolution: 1,
	// 	forceCanvas: true,
	// 	preserveDrawingBuffer: true
	// })

	onMount( async e => {
		await init()
	})

	export let project
	export let files
	export let IDX
	export let THUMBS

	let editorEl

	const mm2px = mm => ( Math.round( ( project.config.dpi / 25.4 ) * mm ) )

	/* UNIFORMS - set uniforms and px width and height */

	let lastConfig 
	let uniforms = {}
	$: (async project_ => {

		uniforms.solo = solo != null

		let str = JSON.stringify( project.config )
		if (str == lastConfig) return
		lastConfig = str

		console.log('[Project] 🛠  project config updated')

		uniforms.hsla = options.backgrounds.find( b => b.name == project.config.background ).colour
		uniforms.size = options.sizes.find( b => b.name == project.config.size ).xy

		if (!project.info) project.info = {}

		project.info.width = mm2px( uniforms.size[0] )
		project.info.height = mm2px( uniforms.size[1] )

		await pixi.app.renderer.resize(project.info.width,project.info.height)

	})( project )



	let fit = {} 



	async function init() {

		console.log(`[Project] 🎉  initing`)


		editorEl.appendChild(pixi.app.view)

		layers.background.drawRect(0,0,project.info.width,project.info.height)
		layers.background.filters = [ new PIXI.Filter(null, `
			${glLib}
			varying vec2 vTextureCoord;
			uniform bool solo;
			uniform sampler2D uSampler;
			uniform vec4 hsla;

			void main(void) {

				vec3 bg3 = vec3(hsla.x / 360.0, hsla.y / 100.0, hsla.z / 100.0);
				vec4 bg4 = vec4( hsl2rgb( bg3 ), 1.0 );
				if (solo) bg4 = vec4(0.0,0.0,0.0,0.0);
				gl_FragColor = bg4;

			}`, 
		uniforms)]
		pixi.app.stage.addChild( layers.container )
		layers.container.addChild( layers.background )
		layers.container.addChild( layers.processed )

		console.log(`[Project] 🎉  run update?`)



	}


	let lastFiles

	async function setup( files ) {

		let str = JSON.stringify(files)
		if (lastFiles == str) return
		lastFiles = str

		console.log('[Project] 💿  setup, pixi.loader is resetting', files)

		if (!files?.srcs) {
			console.log(`[Project] 💿 ❌  no files.srcs`)
			return
		}

		let list = project.files.filter( name => files.srcs[name] )
		if (list.length != project.files.length) {
			console.log(`[Project] 💿 ❌  list doesn't match project.files`, {list, srcs: project.files })
			return
		}

		await pixi.loader.reset()
		for (const name of project.files) {
			let o = files.srcs[name]
			if (!pixi.loader.resources[o.url]) pixi.loader.add( o.url, { crossOrigin: 'anonymous' })
		}

		await setPositions()

		pixi.loader.load(async e => {
			console.log('[Project] 💿 ✅  pixi.loader loaded files')
			await drawImages()
			// await renderThumbnail()
		})
		inited = true
	}

	$: setup( files )


	/* UPDATE - when project config changes...*/

	let updateTimeout
	let lastLayerLength

	$: (( config ) => {

		if (pixi?.app?.renderer && inited ) {


			const { width, height } = project.info

			if (updateTimeout) {
				clearTimeout( updateTimeout )
				updateTimeout = null
			}

			updateTimeout = setTimeout( async e => {


				// console.log('[Project] 🪡  update')
				console.log('[Project] 💫  update triggered...')

				if (!project.multiple && project.files.length > 1) {
					if (!window.confirm(`Remove ${project.files.length - 1} images from project?`)) return
					project.files = project.files.splice(1,project.files.length)
				}
				const neuSize = width != layers.background.width || height != layers.background.height
				const neuMargin = project.config.margin != prevMargin
				const isCanvasChanged = neuSize || neuMargin
				const isNewFiles = project.files.length != Object.keys(pixi.loader.resources).length
				const isNewLayer = project.layers.length != lastLayerLength
				lastLayerLength = project.layers.length
				const isTrigger = project.trigger
				let something = false


				// console.log( { isCanvasChanged, isNewLayer, isNewFiles, isTrigger } )

				if (isNewFiles || isTrigger) {
					console.log('[Project] 💫  new files, running setup...')
					await setup( files )
					something = true
					project.trigger = false
				} 

				
				if ( isCanvasChanged || isNewLayer ) {
					console.log('[Project] 💫  canvas is changed, running setPositions and drawImages...')
					await setPositions()
					await drawImages()
					something = true
				}


				// await drawImages()
				// if (!something) console.log(`[Project] 🪡💤  nothing happened`)
				// await renderThumbnail()

				/* draw lores version */


				// let loresEl = editorEl.querySelector('#lores')
				// console.log(editorEl, loresEl)
				// loresEl.width = project.info.width / 2
				// loresEl.height = project.info.height / 2
				
				// let pix = await pixi.app.renderer.plugins.extract.image()
				// loresEl.getContext('2d').putImageData(, loresEl.width, loresEl.height)


			}, 100)

		}
	})( project.config )



	let prevMargin

	async function removeChildren( obj ) {

		for (let x = obj.children.length - 1; x >= 0; x--) {
			// await obj.children[x].destroy( { children: true })
			await obj.removeChild(obj.children[x])
		}
	}

	async function drawImages() {

		const { width, height } = project.info
		console.log(`[Project] 🖼  drawing images ${width} ${height}`)

		const len = Object.keys(pixi.loader.resources).length
		const size = rectd.neu( 0, 0, width, height )
		const inner = rectd.shrinkBy( size, mm2px( project.config.margin ) )
		prevMargin = project.config.margin
		let splits = rectd.splitUp( inner, len )

		for (let idx = 0; idx < project.layers.length; idx++) {

			if (!layers.groups[idx]) layers.groups[idx] = new PIXI.Container()
			await removeChildren( layers.groups[idx] )

			let i = 0
			for (const [name, resource] of Object.entries(pixi.loader.resources) ) {

				let sprite = new PIXI.Sprite( resource.texture )
				let image = rectd.neu( 0, 0, resource.data.width, resource.data.height )


				sprite.width = width
				sprite.height = height

				let fit = rectd.fitInto( image, inner )
				rectd.auto( fit, sprite )

				if (splits.length > 1) {
					let mask = new PIXI.Graphics()
					mask.drawRect(splits[i].x,splits[i].y,splits[i].width,splits[i].height)
					sprite.mask = mask
				}

				console.log(`[Project] 🖼  added sprite ${name} ${sprite.width} ${sprite.height}`)

				await layers.groups[idx].addChild( sprite )
				i += 1
			}

			layers.processed.addChild( layers.groups[idx] )

		}


		console.log(`[Project] 🖼 ✅  ${Object.keys(pixi.loader.resources).length} images drawn in ${project.layers.length} layers`)



	}

	let inited = false

	async function setPositions() {

		const { width, height } = project.info

		layers.background.width = width
		layers.background.height = height

		// layers.container.x = editorEl.offsetWidth / 2
		// layers.container.y = editorEl.offsetHeight / 2

		// layers.container.pivot.x = width/2
		// layers.container.pivot.y = height/2

		console.log(`[Project] 📐  positions set ${width} ${height}`)
	}


	let classes = {
		miniButtons: `p0 rel w3em h3em bg pointer z-index4 bt0-solid br0-solid`,
		lanes: `flex column br1-solid overflow-auto no-basis grow`
	}


	let targets = {}

	let arrowClass = `p0 no-grow flex row-center-center w3em b0-solid`


	function move(from, to) {
		let cp = project.files
		project.files = []
		let i = cp.splice(from, 1)[0]
		cp.splice(to, 0, i)
		project.files = cp
	}
	function onFileDown( idx ) {
		let to = idx + 1
		if (to >= project.files.length) return
		move( idx, to )

	}
	function onFileUp( idx ) {
		let to = idx - 1
		if (to < 0) return
		move( idx, to )
	}
	function onFileDelete( idx ) {
		project.files = [...project.files.slice(0,idx), ...project.files.slice(idx+1,project.files.length)]
	}





</script>


<div 
	style
	bind:this={main} class="flex row-stretch-stretch bg overflow-hidden grow">


	<nav class="basis30pc minw52em maxw62em flex column-stretch-stretch grow">

		<div 
			class="flex row grow overflow-hidden">






			<!-- PROJECTS (SLOT) -->




			<section class={classes.lanes + ' basis0pc'}>

				<!-- LAYOUT -->


				<Title>Layout</Title>
				<div class="p1 flex column cmb1 bb1-solid">
					<div class="flex row">
						<div 
							on:click={e => project.multiple = false}
							class="br0-solid flex row-flex-start-center mr1 ">
							<span 
								class="b1-solid rel checker w2em h2em block mr1">
								<span class:cross={!project.multiple} class="fill" />
							</span>
							Single
						</div>
						<div 
							on:click={e => project.multiple = true}
							class="br0-solid flex row-flex-start-center mr1 ">
							<span 
								class="b1-solid rel checker w2em h2em block mr1">
								<span class:cross={project.multiple} class="fill" />
							</span>
							Multiple
						</div>
					</div>

					<aside>
						{#if !project.files || project.files.length == 0} 
							<div class="button b1-solid error">No image(s) selected</div>
						{/if}
						{#each project.files as file, idx}
							<div class="flex row-stretch-stretch b1-solid" style="margin-top:-1px">
								<span class="h3em flex column-flex-start-center plr1 grow">{file}</span>
								<button 
									on:click={ e => onFileUp(idx) }
									class="{arrowClass} arrow rotate180 br1-solid" />
								<button 
									on:click={ e => onFileDown(idx) }
									class="{arrowClass} arrow bl1-solid " />
								<!-- <button 
									on:click={ e => onFileDelete(idx) }
									class="{arrowClass} bl1-solid">
									<span class="cross block p0-4" />
								</button> -->
							</div>
						{/each}
					</aside>

					<div class="flex rel">
						<span class="h3em flex row-center-center abs l1 t0 z-index2 fade">
							Paper
						</span>
						<div class="select w100pc grow">
							<select class="pl5 w100pc align-right" bind:value={project.config.background}>
								{#each options.backgrounds as bg}
									<option value={bg.name} name={bg.name}>{bg.name}</option>
								{/each}
							</select>
						</div>
					</div>
					<div class="flex rel">
						<span class="h3em flex row-center-center abs l1 t0 z-index2 fade">
							Size
						</span>
						<div class="select w100pc grow">
							<select class="pl5 w100pc" bind:value={project.config.size}>
								{#each options.sizes as sz}
									<option value={sz.name} name={sz.name}>{sz.name}</option>
								{/each}
							</select>
						</div>
					</div>
					<div class="flex rel">
						<span class="h3em flex row-center-center abs l1 t0 z-index2 fade">
							DPI
						</span>
						<input 
							min={150}
							max={600}
							step={50}
							type="number" 
							class="w100pc grow"
							style="padding-left:5em"
							placeholder="DPI" 
							bind:value={project.config.dpi} />
					</div>
					<div class="flex rel">
						<span class="h3em flex row-center-center abs l1 t0 z-index2 fade">
							Margin
						</span>
						<input 
							min={0}
							max={ 1 }
							step={1}
							class="w100pc grow"
							style="padding-left:5em"
							type="number" 
							placeholder="Margin" 
							bind:value={project.config.margin} />
					</div>


				</div>
				
			</section>




			<!-- LAYOUT / LAYERS -->




			<section id="layers" class={classes.lanes + ' basis20pc'}>

				<!-- LAYERS -->
				<Layers bind:groups={layers.groups} bind:layers={project.layers} bind:solo={solo} />

			</section>
		</div>
	</nav>
	<Canvas bind:project={project} bind:editorEl={editorEl} />
</div>

