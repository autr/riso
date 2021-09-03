<script>
	import { onMount } from 'svelte'
	import Project from './lib/Project.svelte'
	import Title from './lib/Title.svelte'
	import options from './lib/_options.js'
	import { get, set } from 'idb-keyval'
	import Files from './lib/Files.svelte'
	import Colours from './lib/Colours.svelte'
	import { library, inited, exporting } from './lib/_stores.js'

	onMount( async e => {
		await loadDb()
	} )

	let intro = {
		layers: [{}],
		config: {
			background: options.backgrounds[0].name,
			size: options.sizes[1].name,
			dpi: 300, 
			margin: 10,
			rows: 2,
			columns: 2
		},
		multiple: false,
		fileNames: ['large'] //[ 'autr', 'test', 'alt']
	}


	let FILES = {}
	let PROJECTS = [ intro ]
	let THUMBS = [ ]
	let IDX = 0


	let filesBin = {
		items: [
			{
				name: 'test',
				url: 'sources/swiss.png',
				static: true
			},
			{
				name: 'autr',
				url: 'sources/001.png',
				static: true
			},
			{
				name: 'alt',
				url: 'sources/002.png',
				static: true
			},
			{
				name: 'wheel',
				url: 'sources/wheel.jpg',
				static: true
			},
			{
				name: 'large',
				url: 'sources/large.jpg',
				static: true
			}
		],
		srcs: {} 
	}


	const KEY = 'RISOGRAPHINATOR'
	const FILES_KEY = `${KEY}_FILES`
	const PROJECTS_KEY = `${KEY}_PROJECTS`
	const THUMBS_KEY = `${KEY}_THUMBS`


	async function loadDb() {
		// await set( PROJECTS_KEY, [] )

		const neuFiles = (await get( FILES_KEY ) || [])
		filesBin.items = filesBin.items.concat( neuFiles )
		console.log(`[App] ⏱  loaded ${neuFiles.length} file references from db`)


		PROJECTS = (await get( PROJECTS_KEY )).filter( p => (p))
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

			console.log(`[App] 💦  saved ${PROJECTS.length} projects to db`)
			await set( PROJECTS_KEY, cleaned )
		}, 200)
		
	}

	async function clearDatabases() {
		await set( PROJECTS_KEY, [] )
		await set( FILES_KEY, [] )
	}

    async function addLayer() {
        console.log('[Project] 🍰  adding new layer')
        let cp = PROJECTS[IDX].layers
        PROJECTS[IDX].layers = []
        cp.push( { flag: true } )
        PROJECTS[IDX].layers = cp
    }



</script>



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

	<div class="fixed l0 t0 w100vw h100vh bg z-index9 overflow-auto" class:none={!$library} >
		<Files bind:filesBin={filesBin} bind:project={PROJECTS[IDX]} />
	</div>

	<div class="wrapper flex column h100vh">
		<header class="bg plr1 pb1 pt1 bb1-solid flex row-space-between-center">
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
				<button on:click={clearDatabases}>
	                <span class="icon">replay</span>
					Clear Databases
				</button>
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
				<button class="pop">
	                <span class="icon">visibility</span>
					Preview
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
		<footer class="bt1-solid bg flex row-space-between-center plr1 ptb0-5">	
			<div>
				Hello world
			</div>
			<div>
				Something
			</div>
		</footer>
	</div>
{/if}