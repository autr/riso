<script>
	import { exporting, solo, inited, processing, transform } from './_stores.js'
	import utils from './_utils.js'
	import rectd from './_rectd.js'
	import colours_raw from './_colours.js'
	export let pixi 
	export let quik
	export let project

	let lastMode = 99999

	let colours = colours_raw()

	let t1, t2

	const stamp = e => ((t2 - t1) / 1000) + 's'


	function createLayerOutput( layer ) {
		return new Promise( (resolve,reject) => {

			const idx = project.layers.indexOf(layer)
			console.log(`[Export] 🍄  setting solo ${idx}`)
			solo.set( idx )
			setTimeout( async e => {

				// return resolve( true )
				t1 = Date.now()
				let pix = await pixi.app.renderer.plugins.extract.base64()
				t2 = Date.now()
				console.log(`[Export] 🍄  exported ${layer.id} in ${stamp()}`)
				resolve( pix )
			}, 100)
		})
	}

	let output = {}
	let thumbs = {}
	let ready = {}

	$: (async (_exporting, _initedDb, _initedCanvas) => {
		if ($exporting != lastMode && _initedDb && _initedCanvas) {
			lastMode = $exporting
			if ($exporting) {
				let { width, height } = project.info
				console.log(`[Export] 🍄  exporting at ${width} ${height}`)
				let OG = $transform
				transform.set({
					x: 0,
					y: 0,
					scale: 1
				})
				processing.set( true )
				output = {}
				thumbs = {}
				ready = {}

				// pixi.app.renderer.backgroundColor = 0xffffffff


				setTimeout( async e => {

					await pixi.app.renderer.resize(width, height)
					pixi.app.stage.scale.set( 1 )
					pixi.app.stage.x = 0
					pixi.app.stage.y = 0
					let DEBUG = false
					if (!DEBUG) {
						console.log(`[Export] 🍄  setting canvas width and height ${width} ${height} ${pixi.app.stage.width} ${pixi.app.stage.height}`)
						let idx = 0
						for (const layer of project.layers ) {
							//output[ layer.id ] = 
							let pix = await createLayerOutput( layer )
							output[idx] = pix
							thumbs[idx] = await utils.createThumbnail( pix, rectd.create(0,0,width*0.1,height*0.1))
							ready[idx] = true
							idx += 1
						}

					}

					console.log(`[Export] ✅  export complete, resetting transform`)
					processing.set( false )
					solo.set(null)
					// pixi.app.renderer.backgroundColor = 0x00000000
					transform.set( OG )
				}, 100)



			}
		}
	})($exporting, $inited.db, $inited.canvas)

</script>

								<!--  -->

{#if $exporting && $inited.db}

	<div class="fill fixed checkered flex column z-index9">
		<header class="flex row-space-between-center p1 bb1-solid bg">
			<div>
	            <button on:click={e => exporting.set(false)}>
	                <span class="icon">arrow_back</span>
	                Cancel
	            </button>
			</div>
			<div>
				<button>
					<span class="icon">download</span>
					Save All Zipped
				</button>
			</div>
		</header>
		<div class="grow checkered wrap overflow-auto flex row-stretch-flex-start row pl1 pt1">
			{#each project.layers as layer, idx }
				<div class="flex column b1-solid minw20em no-basis mr1 mb1">
					<header class="bb1-solid bg flex row-space-between-center pop">
						<div class="flex row-flex-start-center ptb0-2 plr1">
							<span 
								style={`background-color:rgb(${colours?.[layer.colour]?.rgb})`}
								class="flex w2em h2em b1-solid radius2em mr1" />
							<span>Layer {idx + 1}</span>
						</div>
						<a 
							class="bl1-solid pl1 ptb0-7 pr0-7 " 
							href={output[idx]} 
							disabled={!ready[idx]}
							download={layer.id + '.png'}>
							<span 
								class:disabled={!ready[idx]}
								class="icon">download</span>
						</a>
					</header>
					<div 
						class="flex" 
						target="_blank"
						href={output[idx]} >
						{#if ready[idx]}
							<img class="export" src={thumbs[idx]} download={layer.id + '.png'} />
						{:else}
							<div 
								style="padding-top: {(project.info.height/project.info.width)*100}%"
								class="p1 flex row-center-center cross bg grow">
								<span class="fill flex row-center-center">
									<span class="b1-solid ptb0-5 plr1 bg">Rendering...</span>
								</span>
							</div>
						{/if}
					</div>
					<!-- <footer class="p1 b1-solid pop">
					</footer> -->

				</div>
			{/each}
		</div>
	</div>

{/if}