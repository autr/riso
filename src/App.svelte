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


		PROJECTS = (await db.get.projects() || []).filter( p => (p))
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

	async function saveDBLocally() {

		let cleaned = [...PROJECTS].map( p => {

			return { ...p, layers: p.layers.map( l => {
				return {...l, filterGlobals: null, globals: null, uSampler: null}
			})}
		})

		console.log(`[App] 💦  ${PROJECTS.length} project(s) saved`)
		await db.set.projects( cleaned )
	}

	async function saveDb() {
		if (saveTimeout) {
			clearTimeout(saveTimeout)
			saveTimeout = null
		}
		saveTimeout = setTimeout( saveDBLocally, 200)
		
	}

	async function clearDatabases() {

        if (!window.confirm(`Remove all projects, palettes and file references. Are you sure?`)) return
		let ks = Object.keys(db.set)
		for (const k of ks) await db.set[k]( null )
	}

    async function addLayer() {
        console.log('[App] 🍰  adding new layer')
        let cp = PROJECTS[IDX].layers
        PROJECTS[IDX].layers = []
        cp.push( { flag: true } )
        PROJECTS[IDX].layers = cp
    }

    let showProjects = false

    async function setProject( idx ) {

    	$inited.db = false
    	setTimeout( async e => {
	    	await loadDb()
	    	IDX = idx
	        console.log(`[App] 🚚  loaded project at ${IDX}`)
	        setTimeout( e => (showProjects = false), 200)
    	}, 1)
    }

    async function newProject() {
    	$inited.db = false
    	setTimeout( async e => {
	    	PROJECTS.push( intro )
	    	await saveDBLocally()
	    	await loadDb()
	    	IDX = PROJECTS.length - 1
	        console.log(`[App] 🥳  created new project at ${IDX}`)
	        setTimeout( e => (showProjects = false), 200)
    	}, 1)
    }

    async function removeProject( idx ) {

    	$inited.db = false
    	setTimeout( async e => {
	    	PROJECTS = PROJECTS.filter( (p,i) => i != idx )
	    	await saveDBLocally()
	    	await loadDb()
	    	if (IDX >= PROJECTS.length) IDX -= 1
	        console.log(`[App] 🗑  removed project at ${idx}`)
    	}, 1)

    }
    async function copyProject( idx ) {
    	$inited.db = false
    	let cp = JSON.parse( JSON.stringify( PROJECTS[idx] ) )
    	cp.name += ' Copy'
    	setTimeout( async e => {
	    	PROJECTS.push( cp )
	    	await saveDBLocally()
	    	await loadDb()
	    	IDX = PROJECTS.length - 1
	        console.log(`[App] 👯‍♀️  copied project at ${idx}`)
    	}, 1)
    }

</script>



<Incompatible />


	<div 
		class="fixed l0 t0 w100vw h100vh bg z-index9 overflow-auto" 
		class:none={!$library} >
		<Files bind:filesBin={filesBin} bind:project={PROJECTS[IDX]} />
	</div>

	<div class="wrapper flex column h100vh checkered">
		<header 
			id="header"
			class:electron={$electron}
			class="bg plr1 pb1 pt1 bb1-solid flex row-space-between-center">
			<div class=" flex row-flex-start-center cmr1">
				<span 
					class:none={!showProjects}
					on:click={ e => (showProjects = false) }
					class="w100pc h100pc l0 t0 fixed z-index98 unclickable" />
				<div class="rel">
					<button class="text-left align-left unclickable" on:click={e => (showProjects = !showProjects)}>
						<span class="icon">folder_open</span>
						Load Project
						<span class="chevron ml2 mb0-3" />
					</button>

					<div 
						style="margin-top:-1px;top:100%"
						class="abs z-index99 unclickable l0 minw24em pop b1-solid flex column-stretch-flex-start" 
						class:none={!showProjects}>

						{#each PROJECTS as p, idx}
							<div 
								on:click={e => setProject(idx)}
								class="unclickable  plr1 ptb0-7 bg bb1-solid flex row-space-between-center"
								class:pop={idx != IDX}>
								<span>
									<!-- {#if idx == IDX}
										<span class="icon">radio_button_checked</span>
									{:else}
										<span class="icon">radio_button_unchecked</span>
									{/if} -->
									<span>{p.name}</span>
								</span>
								<span class="flex row-flex-end-center cml1 ml1">

				                    <div 
				                        class="flex h2em w2em row-center-center pointer f0 radius2em"
				                        on:click={ e => copyProject( idx ) }>
				                        <span class="icon t0 l0">copy_all</span>   
				                    </div>
				                    <div 
				                        class="flex h2em w2em row-center-center pointer radius2em"
				                        on:click={ e => removeProject( idx ) }>
				                        <span class="icon t0 l0">clear</span>   
				                    </div>
								</span>
							</div>
						{/each}

						<div 
							on:click={newProject}
							class=" plr1 ptb1 text-center pop ">
							<span class="icon">add</span>
							<span>Create New Project</span>
						</div>
					</div>
				</div>

			    <button 
			        on:click={e => ($library = !$library)}>
	                <span class="icon">photo</span>
			        Select Images
			    </button>
			    <button 
			        class=""
			        disabled={PROJECTS?.[IDX]?.layers?.length >= 5}
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
		{#if $inited.db && PROJECTS[IDX]}
			<Project 
				bind:IDX={IDX}
				bind:THUMBS={THUMBS}
				bind:project={PROJECTS[IDX]} 
				filesBin={filesBin}>
			</Project>
		{/if}
		<!-- <footer class="bt1-solid bg flex row-space-between-center plr1 ptb0-5">	
			<div>
				Hello world
			</div>
			<div>
				Something
			</div>
		</footer> -->
	</div>