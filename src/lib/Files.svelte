<script>
    import { onMount } from 'svelte'
    import { library } from './_stores.js'

    export let files
    export let project

    $: needsSync = files.handles.filter( h => !files.srcs[h.name] )

    onMount( async e => {
        console.log('!!')
        await requestAll()
    } )


    function selectImage( handle ) {

        let idx = PROJECTS[ IDX ].files.indexOf(handle.name)
        if (!PROJECTS[ IDX ].multiple) {
            PROJECTS[ IDX ].trigger = true
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
        accessFiles,
        requestAll,
        selectImage,
        removeHandle,
        requestFile,
        clearAllHandles
    }

    let classes = {
        miniButtons: `p0 rel w3em h3em bg pointer z-index4 bt0-solid br0-solid`,
        lanes: `flex column br1-solid overflow-auto no-basis grow`
    }


    let CANDIDATES = []

    $: (lib => {
        if ($library) {
            console.log('SET CANDIDATES')
        }
    })($library)

</script>


<!-- FILES -->


<section class="flex column checker h100vh w100vw">
    <!-- <Title>Files</Title> -->
    <div class="flex row-space-between-center p1">
        <div class="flex row-flex-start-center cmr1">
            <button 
                on:click={handlers.accessFiles}>
                Add Files
            </button>
            <button 
                disabled={needsSync}
                on:click={handlers.requestAll}>
                Sync Files
            </button>
            <button 
                on:click={handlers.clearAllHandles}>
                Clear All
            </button>
        </div>
        <div class="flex row-flex-end-center cml1">

            <button on:click={e => library.set(false)}>
                Cancel
            </button>
            <button >
                Save
            </button>
        </div>
    </div>
    <div class="flex grow overflow-auto">
        <div class="flex row-stretch-flex-start wrap">
            {#each files.handles as handle, i}
                <div 
                    class:bt1-solid={i==0}
                    class:pop={project.files.indexOf(handle.name)!=-1}
                    class="flex column basis0em grow minw16em p1 rel">
                    <header class="pop b1-solid p1">
                        BLAH
                    </header>
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
    </div>
        
    {#if files.handles.length == 0 }
        <div class="p1">No files</div>
    {/if}
</section>
