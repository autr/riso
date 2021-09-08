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
	import Layouts from './Layouts.svelte'
	import Export from './Export.svelte'
	import Config from './Config.svelte'

	import { dragging, transform, zoom, exporting, processing, solo, inited, trigger } from './_stores.js'

	let main, app, stage, loader, mode

	window.PIXI = PIXI
	PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST

	let quik = window.quik = {
		allContainer: new PIXI.Container(),
		paperBackground: new PIXI.Graphics(),
		inkLayerGroups: [],
		inkLayerContainer: new PIXI.Container(),
		sprites: {}
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


	onMount( init )

	export let project
	export let filesBin
	export let IDX
	export let THUMBS

	let editorEl

	const mm2px = mm => ( Math.round( ( project.config.dpi / 25.4 ) * mm ) )

	/* UNIFORMS - set uniforms and px width and height */

	let lastConfig 
	let uniforms = {}
	$: (async project_ => {

		uniforms.solo = $solo != null

		let str = JSON.stringify( project.config )
		if (str == lastConfig) return
		lastConfig = str


		uniforms.hsla = options.backgrounds.find( b => b.name == project.config.background ).colour
		uniforms.size = options.sizes.find( b => b.name == project.config.size ).xy

		console.log('[Project] 🐝  setting uniforms...', uniforms, uniforms.hsla.join(','))

		if (!project.info) project.info = {}

		project.info.width = mm2px( uniforms.size[0] )
		project.info.height = mm2px( uniforms.size[1] )

		await pixi.app.renderer.resize(project.info.width,project.info.height)

	})( project )

	let fit = {} 



	async function init() {

		console.log(`[Project] 🎉  initing`)


		editorEl.appendChild(pixi.app.view)

		quik.paperBackground.drawRect(0,0,project.info.width,project.info.height)
		quik.paperBackground.filters = [ new PIXI.Filter(null, `
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
		pixi.app.stage.addChild( quik.allContainer )
		quik.allContainer.addChild( quik.paperBackground )
		quik.allContainer.addChild( quik.inkLayerContainer )

		console.log(`[Project] 🎉  run update?`)

	}


	let lastFiles

	async function setup( filesBin ) {

		let str = JSON.stringify(filesBin)
		if (lastFiles == str) return
		lastFiles = str

		console.log('[Project] 💿  pixi.loader is resetting due to new files', filesBin)

		if (!filesBin?.srcs) {
			console.log(`[Project] 💿 ❌  no filesBin.srcs`)
			return
		}

		let list = project.fileNames.filter( name => filesBin.srcs[name] )
		if (list.length != project.fileNames.length) {
			console.log(`[Project] 💿 ❌  list doesn't match project.fileNames`, {list, srcs: project.fileNames })
			return
		}

		await pixi.loader.reset()
		for (const name of project.fileNames) {
			let o = filesBin.srcs[name]
			if (!pixi.loader.resources[o.url]) pixi.loader.add( o.url, { crossOrigin: 'anonymous' })
		}

		await setPositions()

		pixi.loader.load(async e => {
			console.log('[Project] 💿 ✅  pixi.loader loaded filesBin')
			await drawImages()
			// await renderThumbnail()
		})
		$inited.project = true
		console.log('[Project] 💿  running initial update...')
		await update( project.config )

	}

	$: setup( filesBin )


	/* UPDATE - when project config changes...*/

	let updateTimeout, pixelsTimeout
	let lastLayerLength, lastFilesStr, lastMargin, lastLayout

	$: update(project.config)

	async function update( config ) {


		if (pixi?.app?.renderer && $inited.project ) {

			const { width, height } = project.info

			if (updateTimeout) {
				clearTimeout( updateTimeout )
				updateTimeout = null
			}

			updateTimeout = setTimeout( async e => {


				// console.log('[Project] 🪡  update')
				console.log('[Project] 💫  update triggered...')

				/* if canvas size or margin changes... */

				const neuSize = width != quik.paperBackground.width || height != quik.paperBackground.height
				const neuMargin = project.config.margin != lastMargin
				const neuLayout = project.config.layout != lastLayout
				lastMargin = project.config.margin
				lastLayout = project.config.layout
				const isCanvasChanged = neuSize || neuMargin || neuLayout

				/* if project files change... */

				let filesStr = JSON.stringify(project.fileNames)
				const isNewFilenames = filesStr != lastFilesStr
				lastFilesStr = filesStr

				/* if there is a new layer... */

				const isNewLayer = project.layers.length != lastLayerLength
				lastLayerLength = project.layers.length

				/* if external trigger... */

				if ( $trigger.setup ) {
					console.log('[Project] 💫  trigger setup...')
					await setup( filesBin )
			        $trigger.setup = false
				} 
				
				if ( isCanvasChanged || isNewLayer || isNewFilenames || $trigger.redraw ) {
					console.log('[Project] 💫  canvas is changed, running setPositions and drawImages...')
					await setPositions()
					await drawImages()
			        $trigger.redraw = false
				}


			}, 100)

		}


	}




	async function removeChildren( obj ) {

		for (let x = obj.children.length - 1; x >= 0; x--) {
			// await obj.children[x].destroy( { children: true })
			await obj.removeChild(obj.children[x])
		}
	}

	async function drawImages() {

		console.log(`[Project] 🖼  drawing images into layers...`)

		quik.sprites = {}

		for (let idx = 0; idx < project.layers.length; idx++) {

			if (!quik.inkLayerGroups[idx]) {

				quik.inkLayerGroups[idx] = new PIXI.Container()
				console.log(`[Project] 🌶  added new layer group at ${idx}`)
			}

			console.log(`[Project] 🗑  resetting inkLayerGroups ${idx}...`)

			await removeChildren( quik.inkLayerGroups[idx] )



			let i = 0

			for (const [url, resource] of Object.entries(pixi.loader.resources) ) {

				let fileItem = filesBin.items.find( f => f.url == url )
				let { name } = fileItem
				let rectCanvas = rectd.neu( 0, 0, project.info.width, project.info.height )
				rectCanvas = rectd.shrinkBy( rectCanvas, mm2px( project.config.margin ) )
				let pixiSprite = new PIXI.Sprite( resource.texture )

				let rowsCols = options.layouts[project.config.layout]
				if (!rowsCols[0] || !rowsCols[1]) console.error(`[Project] no rows and cols?`, rowsCols)
				let cells = rectd.divideUp( rectCanvas, rowsCols[0], rowsCols[1] )

				if ( i < cells.length) {

					/* get cell rectangles...*/

					let rectOuterCell = cells[i]
					let rectFittedCell = rectd.fitInto( pixiSprite, rectOuterCell, 0.5 )
					let rectFittedToCanvas = rectd.fitInto( pixiSprite, rectCanvas, 0.5 )

					/* resize sprite...*/

					rectd.autoSetObject( rectFittedToCanvas, pixiSprite )
					rectd.centerTo( pixiSprite, rectOuterCell)

					/* create cell mask...*/

					const { x, y, width, height } = rectOuterCell
					let pixiMask = new PIXI.Graphics()

					if (i <= 3) pixiMask.drawRect( x, y, width, height )
					if (i > 3) pixiMask.drawRect( i * 320, 2000, 300, 1000 )

					/* mask must be added to object to also scale with it */

					let pixiScaler = new PIXI.Container()
					rectd.autoSetObject( rectCanvas, pixiScaler )
					pixiScaler.mask = pixiMask
					await pixiScaler.addChild( pixiMask )
					await pixiScaler.addChild( pixiSprite )



					await quik.inkLayerGroups[idx].addChild( pixiScaler )

					if (!quik.sprites[ name ]) quik.sprites[name] = []
					quik.sprites[name].push( pixiSprite )

					/* set information for external use... */

					project.layouts[name].values = {
						x: project?.layouts[name]?.values?.x || 0,
						xRange: pixiSprite.width - rectOuterCell.width,
						xOG: pixiSprite.x,
						scale: project?.layouts[name]?.values?.scale || 0,
						scaleOG: (pixiSprite.scale.x + pixiSprite.scale.y)/2,
						y: project?.layouts[name]?.values?.y || 0,
						yRange: pixiSprite.height - rectOuterCell.height,
						yOG: pixiSprite.y
					}

					$trigger.offset = true

				}

				i += 1
			}

			quik.inkLayerContainer.addChild( quik.inkLayerGroups[idx] )

		}


		console.log(`[Project] 🖼 ✅  ${Object.keys(pixi.loader.resources).length} images drawn in ${project.layers.length} layers`)

		$inited.drawn = true



	}


	async function setPositions() {

		const { width, height } = project.info

		quik.paperBackground.width = width
		quik.paperBackground.height = height

		console.log(`[Project] 📐  positions set ${width} ${height}`)
	}


	let classes = {
		miniButtons: `p0 rel w3em h3em bg pointer z-index4 bt0-solid br0-solid`,
		lanes: `flex column br1-solid overflow-auto no-basis grow`
	}


	let targets = {}

	let arrowClass = `p0 no-grow flex row-center-center w3em b0-solid`


	function move(from, to) {
		let cp = project.fileNames
		project.fileNames = []
		let i = cp.splice(from, 1)[0]
		cp.splice(to, 0, i)
		project.fileNames = cp
	}
	function onFileDown( idx ) {
		let to = idx + 1
		if (to >= project.fileNames.length) return
		move( idx, to )

	}
	function onFileUp( idx ) {
		let to = idx - 1
		if (to < 0) return
		move( idx, to )
	}
	function onFileDelete( idx ) {
		project.fileNames = [...project.fileNames.slice(0,idx), ...project.fileNames.slice(idx+1,project.fileNames.length)]
	}


	$: ( async trans => {

		if (!pixi.app.renderer || !pixi.app?.view?.parentElement || $processing ) return

		let { width, height } = pixi.app.renderer
		let { offsetWidth, offsetHeight } = pixi.app.view.parentElement
		if ( width != offsetWidth || height != offsetHeight ) {
			console.log(`[Project] 📏  resizing canvas to fit parent ${offsetWidth} ${offsetHeight}`)
			await pixi.app.renderer.resize(offsetWidth, offsetHeight)
		}



		let current = { x: pixi.app.stage.x, y: pixi.app.stage.y, scale: pixi.app.stage.scale.x }
		let a = JSON.stringify( current )
		let b = JSON.stringify( $transform )
		if (a != b) {

			pixi.app.stage.scale.set( $transform.scale )
			pixi.app.stage.x = $transform.x
			pixi.app.stage.y = $transform.y

			// console.log(`[Project] 📏  stage set to ${pixi.app.stage.x} ${pixi.app.stage.y} ${pixi.app.stage.scale.x}`)
		}

	})($transform)


	let layoutValue = Object.keys(options.layouts)[0]

</script>


<Export 
	{pixi}
	{quik}
	bind:project={project} />


<div 
	style
	bind:this={main} class="flex row-stretch-stretch bg overflow-hidden grow">


	<nav class="basis30pc minw46em maxw52em flex column-stretch-stretch grow">

		<div 
			class="flex row grow overflow-hidden">






			<!-- PROJECTS (SLOT) -->	



			<section class={classes.lanes + ' basis0pc'}>

				<!-- LAYOUT -->


				<div class="p1 flex column cmb1 bb1-solid">


					<Config bind:project={project} />


				</div>

				<Layouts bind:project={project} bind:sprites={quik.sprites} />
				
			</section>




			<!-- LAYOUT / LAYERS -->




			<section id="layers" class={classes.lanes + ' basis20pc '}>

				<!-- LAYERS -->
				<div class="flex column-reverse justify-content-flex-end">
					<Layers 
						bind:inkLayerContainer={quik.inkLayerContainer}
						bind:inkLayerGroups={quik.inkLayerGroups} 
						bind:layers={project.layers} />
				</div>

			</section>
		</div>
	</nav>
	<Canvas bind:project={project} bind:editorEl={editorEl} />
</div>

