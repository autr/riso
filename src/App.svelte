<script>
	import { onMount } from 'svelte'
	import Project from './lib/Project.svelte'
	import Title from './lib/Title.svelte'
	import options from './lib/_options.js'
	import Files from './lib/Files.svelte'
	import Incompatible from './lib/Incompatible.svelte'
	import Colours from './lib/Colours.svelte'
	import { library, inited, exporting, electron, browser, incompatible, warning } from './lib/_stores.js'
	import db from './lib/_db.js'



	window.db = db

	const KEY = 'RISOGRAPHINATOR'
	const FILES_KEY = `${KEY}_FILES`
	const PROJECTS_KEY = `${KEY}_PROJECTS`
	const IGNORE_KEY = `${KEY}_IGNORE`


	

	onMount( async e => {

		let ignore = (await db.get.ignore())
		if (ignore) console.log(`[App] 🚨   ignoring incompatibility warning` )
		console.log(`[App] 🖥   using browser ${$browser.name} ${$browser.version} ${$browser.os}`, {ignore, incompatible: $incompatible} )

		if ($incompatible && !ignore) {
			console.log(`[App] ❌  incompatible browser!`)
			warning.set( true )
		}


		await loadDb()
	} )

	let intro = {
		layers: [{}],
		config: {
			background: options.backgrounds[0].name,
			size: options.sizes[1].name,
			dpi: 300, 
			margin: 7,
			rows: 2,
			columns: 2
		},
		multiple: false,
		fileNames: ['ColorWheel'] //[ 'autr', 'test', 'alt']
	}


	let FILES = {}
	let PROJECTS = [ intro ]
	let THUMBS = [ ]
	let IDX = 0


	let filesBin = {
		items: [
			{
				name: 'ColorWheel',
				url: 'sources/ColorWheel.jpg',
				static: true
			},
			{
				name: 'Photographs',
				url: 'sources/Photographs.png',
				static: true
			}
		],
		srcs: {} 
	}


	if (window.location.href.indexOf('localfsdfhost:5000') != -1) {

		filesBin.items = filesBin.items.concat(
		[
			{
				name: 'GS_00001',
				url: 'sources/GS_00001.jpg',
				static: true
			},
			{
				name: 'GS_00002',
				url: 'sources/GS_00002.png',
				static: true
			},
			{
				name: 'GS_00003',
				url: 'sources/GS_00003.png',
				static: true
			},
			{
				name: 'GS_00004',
				url: 'sources/GS_00004.png',
				static: true
			},
			{
				name: 'GS_00005',
				url: 'sources/GS_00005.png',
				static: true
			},
			{
				name: 'GS_00006',
				url: 'sources/GS_00006.png',
				static: true
			},
			{
				name: 'GS_00007',
				url: 'sources/GS_00007.png',
				static: true
			},
			{
				name: 'GS_00008',
				url: 'sources/GS_00008.png',
				static: true
			},
			{
				name: 'GS_00009',
				url: 'sources/GS_00009.png',
				static: true
			},
			{
				name: 'GS_00010',
				url: 'sources/GS_00010.png',
				static: true
			},
			{
				name: 'GS_00011',
				url: 'sources/GS_00011.png',
				static: true
			},
			{
				name: 'GS_00012',
				url: 'sources/GS_00012.png',
				static: true
			},
			{
				name: 'GS_00013',
				url: 'sources/GS_00013.png',
				static: true
			}
		])
	}


	async function loadDb() {
		// await set( PROJECTS_KEY, [] )

		const neuFiles = (await db.get.files() || [])
		filesBin.items = filesBin.items.concat( neuFiles )
		console.log(`[App] ⏱  loaded ${neuFiles.length} file references from db`)


		PROJECTS = (await db.get.projects()).filter( p => (p))
		if (PROJECTS.length == 0) {
			console.log(`[App] 🚨  no database, loading preset project`)
			PROJECTS.push( intro )
		}

		console.log(`[App] ⏱  loaded ${PROJECTS.length} projects from db`, PROJECTS)
		window.PROJECTS = PROJECTS
		window.FILES = FILES
		$inited.db = true
	}

	async function projectsUpdated( projects_ ) {
		// console.log('projects updated ----- ????')
		await saveDb()
	}

	$: projectsUpdated( PROJECTS )

	let saveTimeout 

	async function saveDb() {
		if (saveTimeout) {
			clearTimeout(saveTimeout)
			saveTimeout = null
		}
		saveTimeout = setTimeout( async e => {

			let cleaned = [...PROJECTS].map( p => {

				return { ...p, layers: p.layers.map( l => {
					return {...l, filterGlobals: null, globals: null, uSampler: null}
				})}
			})

			console.log(`[App] 💦  ${PROJECTS.length} project(s) saved`)
			await db.set.projects( cleaned )
		}, 200)
		
	}

	async function clearDatabases() {

        if (!window.confirm(`Remove all projects, palettes and file references. Are you sure?`)) return
		let ks = Object.keys(db.set)
		for (const k of ks) await db.set[k]( null )
	}

    async function addLayer() {
        console.log('[Project] 🍰  adding new layer')
        let cp = PROJECTS[IDX].layers
        PROJECTS[IDX].layers = []
        cp.push( { flag: true } )
        PROJECTS[IDX].layers = cp
    }



</script>



<Incompatible />

<!-- <Colours overlay={true} /> -->
{#if $inited.db}
	<!-- 
		<Title>Projects</Title>
		<div class="p1">
			<button 
				on:click={e => e} 
				class="w100pc">
				New
			</button>
		</div>
		<div class="checker">
			{#each PROJECTS as project,idx}
				<div 
					class:pop={idx == IDX}
					class="p1 bb1-solid flex row-center-center " class:bt1-solid={idx==0}>
					<img class="b1-solid cross minh2em minw2em" src={THUMBS[IDX]} />
				</div>
			{/each}
		</div> -->

	<div 
		class="fixed l0 t0 w100vw h100vh bg z-index9 overflow-auto" 
		class:none={!$library} >
		<Files bind:filesBin={filesBin} bind:project={PROJECTS[IDX]} />
	</div>

	<div class="wrapper flex column h100vh">
		<header 
			id="header"
			class:electron={$electron}
			class="bg plr1 pb1 pt1 bb1-solid flex row-space-between-center">
			<div class=" flex row-flex-start-center cmr1">

				<!-- <div class="basis5em h100pc select">
	                <span class="icon">folder_open</span>
					<select bind:value={IDX} style="letter-spacing: 4em">
						{#each PROJECTS as p,i}
							<option value={i} name={p.title || ''}>{i} {p.title || ''}</option>
						{/each}
					</select>
				</div>
				<div class="basis5em h100pc select">
	                <span class="icon">palette</span>
					<select value={'Presets'} style="letter-spacing: 4em">
					</select>
				</div> -->
			    <button 
			        on:click={e => ($library = !$library)}>
	                <span class="icon">photo</span>
			        Select Images
			    </button>
			    <button 
			        class=""
			        disabled={PROJECTS[IDX].layers.length >= 5}
			        on:click={e => (e.target.blur())} 
			        on:click={addLayer}>
	                <span class="icon">library_add</span>
			        Add Layer
			    </button>
			</div>
			<div class=" flex row-flex-end-center cml1">
				<!-- <button class="pop">
	                <span class="icon">visibility</span>
					Preview
				</button> -->
				<button on:click={clearDatabases}>
	                <span class="icon">replay</span>
					Clear Databases
				</button>
				<button 
					on:click={ e => exporting.set(true) }
					class="pop">
	                <span class="icon">file_download</span>
					Export
				</button>
			</div>
		</header>
		<Project 
			bind:IDX={IDX}
			bind:THUMBS={THUMBS}
			bind:project={PROJECTS[IDX]} 
			filesBin={filesBin}>
		</Project>
		<!-- <footer class="bt1-solid bg flex row-space-between-center plr1 ptb0-5">	
			<div>
				Hello world
			</div>
			<div>
				Something
			</div>
		</footer> -->
	</div>
{/if}