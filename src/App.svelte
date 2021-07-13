<script>
	import { onMount } from 'svelte'
	import Project from './Project.svelte'
	import Title from './Title.svelte'
	import options from './options.js'
	import { get, set } from 'idb-keyval'


	onMount( setup )

	let intro = {
		layers: [{}],
		config: {
			background: options.backgrounds[0].name,
			size: options.sizes[1].name,
			dpi: 300, 
			margin: 0
		},
		multiple: false,
		files: ['test'] //[ 'autr', 'test', 'alt']
	}




	let FILES = {}
	let PROJECTS = [ intro ]
	let IDX = 0

	async function setup() {
		
		await loadDb()
		await requestAll()

	}

	let files = {
		handles: [
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
			}
		],
		srcs: {} 
	}


	const KEY = 'RISOGRAPHINATOR'
	const FILES_KEY = `${KEY}_FILES`
	const PROJECTS_KEY = `${KEY}_PROJECTS`

	function selectImage( handle ) {

		console.log('SELECTED IMAGE')
		let idx = PROJECTS[ IDX ].files.indexOf(handle.name)
		if (!PROJECTS[ IDX ].multiple) {
			PROJECTS[ IDX ].files = [ handle.name ]
		} else {

			if ( idx == -1 ) {
				let cp = PROJECTS[ IDX ].files
				PROJECTS[ IDX ].files = []
				cp.push( handle.name )
				PROJECTS[ IDX ].files = cp
			} else {
				let cp = PROJECTS[ IDX ].files
				cp.splice(idx, 1)
				PROJECTS[ IDX ].files = cp
			}
		}
	}


	async function requestFile( handle ) {

		if (handle.static) {
			files.srcs[handle.name] = handle
		} else {

	 		let opts = {mode: 'read'}
			let permission = await handle.queryPermission(opts)
			if (permission  != 'granted') permission = await handle.requestPermission(opts)
			if (permission == 'granted') {
				const file = await handle.getFile()
				files.srcs[handle.name] = {
					name: handle.name,
					url: URL.createObjectURL(file)
				}
			} else {
				window.alert(`Could not load ${handle.name}!`)
			}
		}
	}

	async function loadDb() {
		let neu = (await get( FILES_KEY ) || [])
		files.handles = files.handles.concat( neu )
	}

	async function requestAll() {
		for( const handle of files.handles) requestFile( handle )
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

		files.handles = files.handles.concat(neu)
		await set( FILES_KEY, files.handles.filter( h => !h.static ) )
		await requestAll()
	}

	async function removeHandle( handle ) {
		if (!window.confirm(`Remove ${handle.name} from bin?`)) return
		let cp = files.handles
		files.handles = []
		const idx = cp.indexOf(handle)
		if (idx != -1) cp.splice( idx, 1 )
		files.handles = cp
		await set( FILES_KEY, files.handles.filter( h => !h.static ) )
	}
	async function clearAllHandles( handle ) {
		if (!window.confirm(`Remove all files from bin?`)) return
		files.handles = files.handles.filter( h => h.static )
		await set( FILES_KEY, [] )
	}

	let handlers = {

		loadDb,
		accessFiles,
		requestAll,
		selectImage,
		removeHandle,
		requestFile,
		clearAllHandles
	}




</script>

<Project bind:project={PROJECTS[IDX]} bind:files={files} {handlers}>

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
				<img class="b1-solid" src={project.thumbnail} />
			</div>
		{/each}
	</div>
</Project>
