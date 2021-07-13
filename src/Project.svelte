<script>
	import lib from './lib.js'
	import * as PIXI from 'pixi.js'
	import { onMount } from 'svelte'
	import { get, set } from 'idb-keyval'
	import rectd from './rectd.js'
	import options from './options.js'

	import Layer from './Layer.svelte'
	import Palette from './Palette.svelte'
	import Title from './Title.svelte'

	let main, editor, app, stage, loader, mode
	let solo = null


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
	export let handlers
	export let IDX
	export let THUMBS

	let uniforms = {}

	$: _uniforms = {
		hsla: options.backgrounds.find( b => b.name == project.config.background ).colour,
		size: options.sizes.find( b => b.name == project.config.size ).xy
	}

	function setUniforms( unis ) {
		uniforms.hsla = unis.hsla
		uniforms.size = unis.size
		uniforms.solo = solo != null
	}

	$: setUniforms( _uniforms )

	const mm2px = mm => ( Math.round( ( project.config.dpi / 25.4 ) * mm ) )

	$: calculate = {
		width: mm2px( _uniforms.size[0] ),
		height: mm2px( _uniforms.size[1] )
	}

	let fit = {}

	async function onResize(e) {
		await pixi.app.renderer.resize(editor.offsetWidth,editor.offsetHeight)
	}


	async function init() {



		await onResize()
		editor.appendChild(pixi.app.view)

		layers.background.drawRect(0,0,calculate.width,calculate.height)
		layers.background.filters = [ new PIXI.Filter(null, `
			${lib}
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

		console.log(`[Project] 🎉  layers and background inited`)

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

	async function addLayer() {
		console.log('[Project] 🍰  adding layer ------------------------')
		let cp = project.layers
		project.layers = []
		cp.push( { flag: true } )
		project.layers = cp
		await drawImages()
	}

	let thumbTimeout, thumbLookup

	// async function renderThumbnail() {

	// 	if (thumbTimeout) {
	// 		clearTimeout( thumbTimeout )
	// 		thumbTimeout = null
	// 	}
	// 	thumbTimeout = setTimeout( e => {

	// 	}, 1000)



	// }

	async function renderThumbnail() {

		// console.log('doing render...')
		// // await pixi.app.renderer.render(pixi.app.stage)
		// let {width,height} = calculate
		// let ctx = thumbnail.getContext('2d')
		// thumbnail.width = width > height ? 140 : 100
		// thumbnail.height = width > height ? 100 : 140
		// ctx.drawImage( (new PIXI.Extract(pixi.app.renderer)).image(layers.processed), 0, 0, thumbnail.width, thumbnail.height)
		// // let base64 = (new PIXI.Extract(pixi.app.renderer)).base64(layers.groups[0])
		// THUMBS[IDX] = thumbnail.toDataURL()
		// console.log('rendered?')
	}

	async function setup( files ) {


		if (!files?.srcs) return

		let list = project.files.filter( name => files.srcs[name] )
		if (list.length != project.files.length) return

		console.log('[Project] 💥  setup (reset)')
		await pixi.loader.reset()
		for (const name of project.files) {
			let o = files.srcs[name]
			if (!pixi.loader.resources[o.url]) pixi.loader.add( o.url, { crossOrigin: 'anonymous' })
		}

		await setPositions()

		pixi.loader.load(async e => {
			console.log('[Project] ✅💥  files loaded')
			await drawImages()
			// await renderThumbnail()
		})
		inited = true
	}



	async function update( config ) {


		if (pixi?.app?.renderer && inited ) {


			const { width, height } = calculate

			if (sizeTimeout) {
				clearTimeout( sizeTimeout )
				sizeTimeout = null
			}

			sizeTimeout = setTimeout( async e => {


				// console.log('[Project] 🪡  update')

				if (!project.multiple && project.files.length > 1) {
					if (!window.confirm(`Remove ${project.files.length - 1} images from project?`)) return
					project.files = project.files.splice(1,project.files.length)
				}
				const neuSize = width != layers.background.width || height != layers.background.height
				const neuMargin = project.config.margin != prevMargin
				const isCanvasChanged = neuSize || neuMargin
				const isNewFiles = project.files.length != Object.keys(pixi.loader.resources).length
				const isNewLayer = project.layers.length != layers.processed.children.length
				const isTrigger = project.trigger
				let something = false


				if (isNewFiles || isTrigger) {
					console.log('[Project] 🪡✨  new files, run setup')
					await setup( files )
					something = true
					project.trigger = false
				} 
				
				if ( isCanvasChanged ) {
					console.log('[Project] 🪡📐  set positions, draw images')
					await setPositions()
					await drawImages()
					something = true
				}
				// await drawImages()

				// if (!something) console.log(`[Project] 🪡💤  nothing happened`)
				// await renderThumbnail()


			}, 100)

		}
	}

	let sizeTimeout
	$: update( project.config )
	$: setup( files )
	$: needsSync = files.handles.filter( h => !files.srcs[h.name] )
	$: onZoom( zoom )

	let prevMargin

	async function removeChildren( obj ) {

		for (let x = obj.children.length - 1; x >= 0; x--) {
			// await obj.children[x].destroy( { children: true })
			await obj.removeChild(obj.children[x])
		}
	}

	async function drawImages() {

		const { width, height } = calculate



		// await removeChildren( layers.processed )

		console.log('[Project] 🛑  cleared groups ')

		const len = Object.keys(pixi.loader.resources).length
		const size = rectd.neu( 0, 0, width, height )
		const inner = rectd.shrinkBy( size, mm2px( project.config.margin ) )
		prevMargin = project.config.margin
		let splits = rectd.splitUp( inner, len )

		for (let idx = 0; idx < project.layers.length; idx++) {

			let group = layers.groups[idx] = layers.groups[idx] ? layers.groups[idx] : new PIXI.Container()
			await removeChildren( group )

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

				console.log('[Project] 🎉  adding sprite to images:', name, i)

				await group.addChild( sprite )
				i += 1
			}

			layers.processed.addChild( group )

		}


		console.log(`[Project] ✅🖼  ${Object.keys(pixi.loader.resources).length} image(s) drawn in ${project.layers.length} layers`)



	}

	async function onZoom( zoom_ ) {
		console.log('[Project] 🔭  zoom changed')
		layers.container.scale.x = zoom
		layers.container.scale.y = zoom
	}

	let inited = false

	async function setPositions() {

		const { width, height } = calculate

		layers.background.width = width
		layers.background.height = height

		layers.container.x = editor.offsetWidth / 2
		layers.container.y = editor.offsetHeight / 2

		layers.container.pivot.x = width/2
		layers.container.pivot.y = height/2

		console.log('[Project] ✅📐  positions set', {width,height})
	}


	let classes = {
		miniButtons: `p0 rel w3em h3em bg pointer z-index4 bt0-solid br0-solid`,
		lanes: `flex column br1-solid overflow-auto no-basis grow`
	}


	let targets = {}

	let arrowClass = `p0 no-grow flex row-center-center w3em b0-solid`

	let zoom = 0.1

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

	let lastXY

	function onMove(e) {



		let {x,y} = pixi.app.renderer.plugins.interaction.mouse.global
		if (!lastXY) lastXY = {x,y}

		let {offsetWidth,offsetHeight} = editor


		// layers.container.x = editor.offsetWidth / 2
		// layers.container.y = editor.offsetHeight / 2



		layers.container.pivot.x -= (x - lastXY.x) 
		layers.container.pivot.y -= (y - lastXY.y)

		layers.container.x -= (x - lastXY.x) * zoom
		layers.container.y -= (y - lastXY.y) * zoom
		lastXY = {x,y}


		// layers.container.pivot.x = width/2
		// layers.container.pivot.y = height/2


		// pixi.app.stage.pivot.x = offsetWidth/2
		// pixi.app.stage.pivot.y = offsetHeight/2



		x /= offsetWidth
		y /= offsetHeight

		let {width,height} = calculate

		width *= zoom
		height *= zoom


		if (!dragging) return

		layers.container.x = (width - offsetWidth) * x * -1
		layers.container.y = (height - offsetHeight) * y * -1


		// pixi.app.stage.pivot.x = pixi.app.stage.x 
		// pixi.app.stage.pivot.y = pixi.app.stage.y 

	}

	function onScroll(e) {

		e.target.scrollLeft = 4500
		e.target.scrollTop = 4500

	}


	function onWheel(e) {

		if (keys['Alt']) {
			zoom += e.deltaY * 0.001
			if (zoom < 0.01) zoom = 0.01
			if (zoom > 3) zoom = 3
		} else {
			let fract = 0.5
			layers.container.x += e.deltaX * fract * -1
			layers.container.y += e.deltaY * fract * -1
		}
	}
	let dragging = false

	let keys = {}

	async function onKeyDown(e) {
		keys[e.key] = true
	}
	async function onKeyUp(e) {
		keys[e.key] = false
		await renderThumbnail()
	}

	async function onMouseUp(e) {
		await renderThumbnail()
	}

	let thumbnail

</script>

<main 
	style
	bind:this={main} class="flex row-stretch-stretch bg overflow-auto">
	<div class="basis30pc minw52em maxw62em flex column-stretch-stretch grow minh100vh maxh100vh">



		<sidebar 
			class="flex row grow overflow-hidden">


			<!-- FILES -->


			<section class={classes.lanes}>
				<Title>Files</Title>
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
				<div class="checker">
					{#each files.handles as handle, i}
						<div 
							class:bt1-solid={i==0}
							class:pop={project.files.indexOf(handle.name)!=-1}
							class="rel bb1-solid file p1">
							<div class="overlay abs t1 l1 bt1-solid br1-solid flex grow row-flex-end-flex-start z-index2">
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
							<div class="b1-solid flex" on:click={e => handlers.selectImage(handle)}>
								{#if files.srcs[handle.name]}
										<img 
											style={`opacity:${project.files.indexOf(handle.name)!=-1 ? '1;' : '0.8;filter: grayscale(100%);'}`}
											class="" 
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
				</div>
					
				{#if files.handles.length == 0 }
					<div class="p1">No files</div>
				{/if}
			</section>





			<!-- PROJECTS (SLOT) -->




			<section class={classes.lanes + ' basis0pc'}>
				<slot />
			</section>




			<!-- LAYOUT / LAYERS -->




			<section id="layers" class={classes.lanes + ' basis30pc'}>

				<!-- LAYOUT -->


				<Title>Layout</Title>
				<div class="hidden abs" style="left:-99999px;top:-99999px" >
				<!-- <div > -->
					<canvas class="b1-solid" id="thumbnail" bind:this={thumbnail} />
					<img class="b1-solid" src={THUMBS[IDX]} />
				</div>
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
							max={Math.max( _uniforms.size[0], _uniforms.size[1] ) * 0.4 }
							step={1}
							class="w100pc grow"
							style="padding-left:5em"
							type="number" 
							placeholder="Margin" 
							bind:value={project.config.margin} />
					</div>


				</div>

				<!-- LAYERS -->


				<Title>Layers</Title>
				{#each layers.groups as group, index}
					<div class="p1" class:bt1-solid={index != 0}>
						<Layer 
							{index}
							{pixi}
							bind:group={group}
							bind:solo={solo}
							bind:layer={project.layers[index]} />
					</div>
				{/each}
				<div class="plr1">
					<button 
						class="w100pc mb1"
						on:click={e => (e.target.blur())} 
						on:click={addLayer}>
						Add layer
					</button>
				</div>
			</section>
		</sidebar>
	</div>

	<section 
		on:mousedown={ e => togglePreview( true ) }
		on:mouseup={ e => togglePreview( false ) }
		class="rel basis70pc minw50em pointer grow flex row-center-flex-start maxh100vh overflow-hidden">
		<div
			id="zoom"
			class="flex fill"
			bind:this={editor} />
		<div 
			id="scroller" 
			on:mousedown={ e => dragging = true}
			on:mouseup={ e => dragging = false}
			on:mouseleave={ e => dragging = false}
			on:mousemove={onMove}
			on:scroll={onScroll} 
			on:wheel={onWheel} 
			class="abs fill overflow-auto" style="width:120%;height:120%;">
			<div style="width:9000px; height:9000px" />
		</div>
		<div class="t1 r1 abs monospace hidden">
			{calculate.width} x {calculate.height}
		</div>
		<div class="abs t0 r2 p1 flex row w3em">

			<div class="flex column">
				<button 
					on:click={e => zoom < 2 ? zoom += 0.05 : null }
					class="p0 h3em m0 w3em flex row-center-center" >
					<span class="flex w1em h1em cross rotate45" />
				</button>
				<div class="h10em flex ">
					<input  
						class="grow p0 m0 h1em round radius1em b1-solid rotate270 abs" 
						style="left: -1.5em;top: 8.5em;width: 8em;margin-left:-0px;margin-top:-0.5px;background: transparent" 
						type="range" 
						min={0.01} 
						max={3} 
						step={0.001} 
						bind:value={zoom} /> 
				</div>
				<button 
					on:click={e => zoom > 0.05 ? zoom -= 0.05 : null }
					class="p0 h3em m0 w3em flex row-center-center" >
						<span class="flex w1em pt0-5 mt0-5 bt1-solid" />
					</button>
				<button 
					class="p0  m0 h3em w3em flex row-center-center bt0-solid" >
						⤢
					</button>
				<button 
					class="p0  m0 h3em w3em flex row-center-center bt0-solid" >
						A
					</button>
				<button 
					class="p0  m0 h3em w3em flex row-center-center mt1" >
						⬚
					</button>

					
			</div>
		</div>
		<footer class="abs b0 l0 p1 w100pc flex row-space-between-flex-end">
			<span class="f1 italic"></span>
			<button>Export</button>
		</footer>
	</section>
</main>

<svelte:window 
	on:mouseup={onMouseUp}
	on:resize={onResize} 
	on:keydown={onKeyDown} 
	on:keyup={onKeyUp} />
