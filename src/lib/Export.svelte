<script>
	import { exporting, solo, inited, processing, transform } from './_stores.js'
	import utils from './_utils.js'
	import rectd from './_rectd.js'
	import colours_raw from './_colours.js'
    import options from './_options.js'
    import { detect } from 'detect-browser'
    import { downloadZip } from 'client-zip'
    import { changeDpiDataUrl } from 'changedpi'

	export let pixi 
	export let quik
	export let project

	let lastMode = 99999

	let colours = colours_raw()

	let t1, t2

	const stamp = e => ((t2 - t1) / 1000) + 's'


	let exportFormats = {
		'PNG': 'image/png',
		'JPG': 'image/jpg'
	}


	function createLayerOutput( ms ) {
		return new Promise( (resolve,reject) => {

			setTimeout( async e => {

				// return resolve( true )
				t1 = Date.now()
				let pix = await pixi.app.renderer.plugins.extract.base64(pixi.app.stage, exportFormats[format], 0)
				console.log(`[Export] ⚖️  setting dpi to ${project.config.dpi}`)
				pix = await changeDpiDataUrl( pix, project.config.dpi )
				t2 = Date.now()
				console.log(`[Export] 🍄  exported as ${format} in ${stamp()}`)
				resolve( pix )
			}, ms || 100)
		})
	}

	let output = {}
	let thumbs = {}
	let ready = {}

	let compounds = {}

	$: (async (_exporting, _initedDb, _initedCanvas) => {
		if ($exporting != lastMode && _initedDb && _initedCanvas) {
			lastMode = $exporting
			if ($exporting) {
				compounds = {}
				for (const layer of project.layers) {
					if (!compounds[layer.colour]) compounds[layer.colour] = []
					compounds[layer.colour].push( layer )
				}
				Object.keys(compounds).forEach( k => {
					compounds[k] = compounds[k].length > 1 ? compounds[k] : null
				})
				await exportAll()
			}
		}
	})($exporting, $inited.db, $inited.canvas)

	let format = Object.keys(exportFormats)[0]


	function exportAll() {

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

					console.log(`[Export] 🍄  setting solo ${idx}`)
					solo.set( idx )

					let pix = await createLayerOutput( )
					output[idx] = pix
					thumbs[idx] = await utils.createThumbnail( pix, rectd.create(0,0,width*0.1,height*0.1))
					ready[idx] = true
					idx += 1
				}

				idx = 0
				const compoundKeys = Object.keys(compounds)

				for (const key of compoundKeys ) {

					const com = compounds[key]
					if (com) {

						let k = 'compound' + key
						console.log(`[Export] 🌿  creating compound ${k}`, com)

						solo.set( null )
						project.compound = true
						for (let layer of com) layer.compound = true

						let pix = await createLayerOutput( 400 )
						output[k] = pix
						thumbs[k] = await utils.createThumbnail( pix, rectd.create(0,0,width*0.1,height*0.1))
						ready[k] = true

						for (let layer of com) layer.compound = false

						project.compound = false
						solo.set(false)
						idx += 1
					}
				}

			}

			solo.set(null)

			let key = 'preview'
			let pix = await createLayerOutput()
			output[key] = pix
			thumbs[key] = await utils.createThumbnail( pix, rectd.create(0,0,width*0.1,height*0.1))
			ready[key] = true

			// preview image



			console.log(`[Export] ✅  export complete, resetting transform`)
			processing.set( false )
			transform.set( OG )
		}, 100)
	}

	async function onDownloadZIP() {
		let contents = []
		let idx = 0
		for (const layer of project.layers) {
			contents.push({
				name: layer.id + '.' + format.toLowerCase(), 
				lastModified: new Date(), 
				input: await fetch( output[idx] )
			})
			idx += 1
		}

		contents.push({
			name: 'Preview.' + format.toLowerCase(), 
			lastModified: new Date(), 
			input: await fetch( output.preview )
		})
		contents.push({
			name: 'Info.txt', 
			lastModified: new Date(), 
			input: textOutput
		})

		const blob = await downloadZip(contents).blob()
		const link = document.createElement('a')
		link.href = URL.createObjectURL(blob)
		link.download = `${project.name || 'Project'} ${new Date().toLocaleString()}.zip`
		link.click()
		link.remove()
	}
	

	async function onRefresh() {
		await exportAll()
	}


	$: textOutput = (_project => {
		if (!project) return
		return `
Rendered: ${new Date()}
From: ${Object.entries(detect()).map( pair => {
	return pair[1].charAt(0).toUpperCase() + pair[1].slice(1)
}).join(' / ') }
${ project.layers.map( (l,i) => {
	let deets = l.type == 0 ? `
Hue Point: ${l.hue_point}
Hue Width: ${l.hue_width}
Hue Falloff: ${l.hue_falloff}
Hue Balance: ${l.hue_balance}` : ``
	return `
Layer ${i+1}
------------
Ink: ${colours[l.colour]?.name} ${colours[l.colour]?.japanese}
Type: ${options.types[l.type]} ${deets}
Inverted: ${l.invert ? 'Yes' : 'No'}
Levels Low: ${l.levels_low}
Levels Mid: ${l.levels_mid}
Levels High: ${l.levels_high}
`
}).reverse().join('\n')}

`.replaceAll('HTML', '')
	})(project)

</script>

								<!--  -->

{#if $exporting && $inited.db}

	<div class="fill fixed checkered flex column z-index9">
		<header class="flex row-space-between-center p1 bb1-solid bg">
			<div class="cmr0-5 flex row-flex-start-center cmr1">
	            <button on:click={e => exporting.set(false)}>
	                <span class="icon">arrow_back</span>
	                Back
	            </button>
	            <div class="f1 flex column">
	            	<span class="">{project.name}</span>
	            	<span class="">{project.layers.length} ink layers, {Object.keys(compounds).filter( k => compounds[k]).length} compound layers
	            </div>
			</div>
			<div class="cml1 flex row-flex-end-stretch">
				<div 
					class="select">
	                <span class="icon abs l0 t0 mt0-7 ml0-5">image</span>
					<select 
						bind:value={format}  class="pl3 pr4 ptb0-7">
						{#each Object.keys(exportFormats) as format,i}
							<option value={format} name={format}>{format}</option>
						{/each}
					</select>
				</div>
				<button disabled={$processing} on:click={onRefresh}>
					<span class="icon">refresh</span>
					Refresh
				</button>
				<button 
					disabled={$processing} 
					on:click={onDownloadZIP}>
					<span class="icon">download</span>
					Save All Zipped
				</button>
			</div>
		</header>
		<div class="grow checkered wrap overflow-auto flex row-center-flex-start row pl1 pt1">


			<!-- LAYERS -->

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
							download={layer.id + '.' + format.toLowerCase()}>
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
							<img class="export" src={thumbs[idx]} download={layer.id + '.' +  + format.toLowerCase()} />
						{:else}
							<div 
								style="padding-top: {(project.info.height/project.info.width)*100}%"
								class="flex row-center-center bg grow rel">
								<span class="fill flex row-center-center">
									<span>
										<span class="icon">schedule</span>
										Rendering
									</span>
								</span>
							</div>
						{/if}
					</div>
					<!-- <footer class="p1 b1-solid pop">
					</footer> -->

				</div>
			{/each}


			<!-- COMPOUND -->


			{#each Object.entries(compounds) as [colour, layer], idx }
				{#if layer}
					<div class="flex column b1-solid minw20em no-basis mr1 mb1">
						<header class="bb1-solid bg flex row-space-between-center pop">
							<div class="flex row-flex-start-center ptb0-2 plr1">
								<span 
									style={`background-color:rgb(${colours?.[colour]?.rgb})`}
									class="flex w2em h2em b1-solid radius2em mr1" />
								<span>Compound {idx + 1}</span>
							</div>
							<a 
								class="bl1-solid pl1 ptb0-7 pr0-7 " 
								href={output['compound'+colour]} 
								disabled={!ready['compound'+colour]}
								download={`Compound ${colours?.[colour]?.name}.${format.toLowerCase()}`}>
								<span 
									class:disabled={!ready[idx]}
									class="icon">download</span>
							</a>
						</header>
						<div 
							class="flex" 
							target="_blank"
							href={output['compound'+colour]} >
							{#if ready['compound'+colour]}
								<img class="export" src={thumbs['compound'+colour]} download={`Compound ${colours?.[colour]?.name}.${format.toLowerCase()}`} />
							{:else}
								<div 
									style="padding-top: {(project.info.height/project.info.width)*100}%"
									class="flex row-center-center bg grow rel">
									<span class="fill flex row-center-center">
										<span>
											<span class="icon">schedule</span>
											Rendering
										</span>
									</span>
								</div>
							{/if}
						</div>
						<!-- <footer class="p1 b1-solid pop">
						</footer> -->

					</div>
				{/if}
			{/each}



			<!-- PREVIEW -->

			<div class="flex column b1-solid minw20em no-basis mr1 mb1">
				<header class="bb1-solid bg flex row-space-between-center pop">
					<div class="flex row-flex-start-center ptb0-2 plr1">
						<span class="flex w2em h2em b1-solid radius2em mr1 flex column-reverse overflow-hidden">
							{#each project.layers as layer}
								<span 
									style={`background-color:rgb(${colours?.[layer.colour]?.rgb})`}
									class="grow w100pc" />
							{/each}
						</span>
						<span>Preview</span>
					</div>
					<a 
						class="bl1-solid pl1 ptb0-7 pr0-7 " 
						href={output.preview} 
						disabled={!ready.preview}
						download={'Preview.' + format.toLowerCase()}>
						<span 
							class:disabled={!ready.preview}
							class="icon">download</span>
					</a>
				</header>
				<div 
					class="flex" 
					target="_blank"
					href={output.preview} >
					{#if ready.preview}
						<img class="export" src={thumbs.preview} download={'Preview.' +  + format.toLowerCase()} />
					{:else}
						<div 
							style="padding-top: {(project.info.height/project.info.width)*100}%"
							class="flex row-center-center bg grow rel">
							<span class="fill flex row-center-center">
								<span>
									<span class="icon">schedule</span>
									Rendering
								</span>
							</span>
						</div>
					{/if}
				</div>
				<!-- <footer class="p1 b1-solid pop">
				</footer> -->

			</div>


			<!-- INFORMATION -->

			<div class="flex column b1-solid minw20em no-basis mr1 mb1">
				<header class="bb1-solid bg flex row-space-between-center pop">
					<div class="flex row-flex-start-center ptb0-2 plr1">
						<span class="flex w2em h2em b1-solid radius2em mr1 flex column-center-center overflow-hidden">
							
							<span class="icon mb0-5 ml0-4 rel">sort</span>
						</span>
						<span>Information</span>
					</div>
					<a 
						class="bl1-solid pl1 ptb0-7 pr0-7 " 
						href={`data:${textOutput}`} 
						download={'Info.txt'}>
						<span 
							class="icon">download</span>
					</a>
				</header>
				<div 
					class="flex" 
					target="_blank"
					href={output.preview} >
					<div 
						style="padding-top: {(project.info.height/project.info.width)*100}%"
						class="flex row-center-center bg grow rel">
						<div class="fill flex column overflow-auto pop p1 ">
							<pre class="monospace">{textOutput}</pre>
						</div>
					</div>
				</div>
				<!-- <footer class="p1 b1-solid pop">
				</footer> -->

			</div>

		</div>
	</div>

{/if}